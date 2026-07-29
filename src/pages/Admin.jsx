import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatMoney } from '../lib/pricing.js'
import './Admin.css'

// Change the admin passcode here.
const ADMIN_PASSCODE = 'foodgazm2024'

const STATUS_OPTIONS = ['New', 'Cooking', 'Done']

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('fg_admin_ok') === '1')
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState('')

  function handlePasscodeSubmit(e) {
    e.preventDefault()
    if (passcodeInput === ADMIN_PASSCODE) {
      sessionStorage.setItem('fg_admin_ok', '1')
      setUnlocked(true)
      setPasscodeError('')
    } else {
      setPasscodeError('Wrong passcode. Try again.')
    }
  }

  if (!unlocked) {
    return (
      <div className="ad-gate-wrap">
        <div className="ad-gate-card">
          <h1 className="ad-gate-title">FOODGAZM</h1>
          <p className="ad-gate-sub">Admin access</p>
          <form onSubmit={handlePasscodeSubmit}>
            <input
              type="password"
              className="ad-gate-input"
              placeholder="Enter passcode"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              autoFocus
            />
            {passcodeError && <div className="ad-gate-error">{passcodeError}</div>}
            <button type="submit" className="ad-gate-btn">
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (active && !error && data) {
        setOrders(data)
      }
      setLoading(false)
    }

    fetchOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const visibleOrders = useMemo(
    () => orders.filter((o) => (showArchived ? o.archived : !o.archived)),
    [orders, showArchived],
  )

  const activeOrders = useMemo(() => orders.filter((o) => !o.archived), [orders])

  const money = useMemo(() => {
    let totalPlates = 0
    let totalExpected = 0
    let totalCollected = 0
    for (const o of activeOrders) {
      totalPlates += o.quantity || 0
      totalExpected += Number(o.order_total) || 0
      if (o.paid) totalCollected += Number(o.order_total) || 0
    }
    return {
      totalPlates,
      totalExpected,
      totalCollected,
      totalOwed: totalExpected - totalCollected,
    }
  }, [activeOrders])

  const tally = useMemo(() => {
    const t = {
      jerk: 0,
      curry: 0,
      riceAndPeas: 0,
      cabbage: 0,
      macAndCheese: 0,
      lemonadeRegular: 0,
      lemonadeStrawberry: 0,
      cakeSlices: 0,
    }
    for (const o of activeOrders) {
      const qty = o.quantity || 0
      if (o.protein === 'Jerk Chicken') t.jerk += qty
      if (o.protein === 'Curry Chicken') t.curry += qty
      const sides = o.sides || []
      if (sides.includes('Rice and Peas')) t.riceAndPeas += qty
      if (sides.includes('Cabbage')) t.cabbage += qty
      if (sides.includes('Mac and Cheese')) t.macAndCheese += qty
      if (o.lemonade_flavor === 'Regular') t.lemonadeRegular += qty
      if (o.lemonade_flavor === 'Strawberry') t.lemonadeStrawberry += qty
      t.cakeSlices += o.cake_slice_count || 0
    }
    return t
  }, [activeOrders])

  async function togglePaid(order) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paid: !o.paid } : o)))
    await supabase.from('orders').update({ paid: !order.paid }).eq('id', order.id)
  }

  async function updateStatus(order, status) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    await supabase.from('orders').update({ status }).eq('id', order.id)
  }

  async function toggleArchived(order) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, archived: !o.archived } : o)))
    await supabase.from('orders').update({ archived: !order.archived }).eq('id', order.id)
  }

  async function archiveAllActive() {
    if (!window.confirm('Archive all active orders? This clears the board but keeps the history.')) return
    const ids = activeOrders.map((o) => o.id)
    if (ids.length === 0) return
    setOrders((prev) => prev.map((o) => (ids.includes(o.id) ? { ...o, archived: true } : o)))
    await supabase.from('orders').update({ archived: true }).in('id', ids)
  }

  return (
    <div className="ad-wrap">
      <header className="ad-header">
        <h1 className="ad-title">FOODGAZM</h1>
        <p className="ad-sub">Admin dashboard</p>
      </header>

      <section className="ad-money-grid">
        <div className="ad-money-card">
          <div className="ad-money-label">Total plates</div>
          <div className="ad-money-value">{money.totalPlates}</div>
        </div>
        <div className="ad-money-card">
          <div className="ad-money-label">Total expected</div>
          <div className="ad-money-value">{formatMoney(money.totalExpected)}</div>
        </div>
        <div className="ad-money-card ad-money-collected">
          <div className="ad-money-label">Collected</div>
          <div className="ad-money-value">{formatMoney(money.totalCollected)}</div>
        </div>
        <div className="ad-money-card ad-money-owed">
          <div className="ad-money-label">Still owed</div>
          <div className="ad-money-value">{formatMoney(money.totalOwed)}</div>
        </div>
      </section>

      <section className="ad-tally">
        <h2 className="ad-section-title">Kitchen tally</h2>
        <div className="ad-tally-grid">
          <TallyItem label="Jerk plates" value={tally.jerk} />
          <TallyItem label="Curry plates" value={tally.curry} />
          <TallyItem label="Rice and Peas" value={tally.riceAndPeas} />
          <TallyItem label="Cabbage" value={tally.cabbage} />
          <TallyItem label="Mac and Cheese" value={tally.macAndCheese} />
          <TallyItem label="Regular lemonade" value={tally.lemonadeRegular} />
          <TallyItem label="Strawberry lemonade" value={tally.lemonadeStrawberry} />
          <TallyItem label="7Up cake slices" value={tally.cakeSlices} />
        </div>
      </section>

      <section className="ad-orders">
        <div className="ad-orders-header">
          <h2 className="ad-section-title">
            {showArchived ? 'Archived orders' : 'Live orders'} ({visibleOrders.length})
          </h2>
          <div className="ad-orders-actions">
            <button className="ad-toggle-btn" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Show active' : 'Show archived'}
            </button>
            {!showArchived && (
              <button className="ad-archive-all-btn" onClick={archiveAllActive}>
                Archive all
              </button>
            )}
          </div>
        </div>

        {loading && <p className="ad-empty">Loading orders...</p>}
        {!loading && visibleOrders.length === 0 && <p className="ad-empty">No orders here yet.</p>}

        <div className="ad-order-list">
          {visibleOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onTogglePaid={() => togglePaid(order)}
              onStatusChange={(status) => updateStatus(order, status)}
              onToggleArchived={() => toggleArchived(order)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function TallyItem({ label, value }) {
  return (
    <div className="ad-tally-item">
      <div className="ad-tally-value">{value}</div>
      <div className="ad-tally-label">{label}</div>
    </div>
  )
}

function OrderRow({ order, onTogglePaid, onStatusChange, onToggleArchived }) {
  const time = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <div className={`ad-order-card ${order.paid ? 'ad-order-paid' : ''}`}>
      <div className="ad-order-top">
        <div>
          <div className="ad-order-name">{order.customer_name}</div>
          <div className="ad-order-phone">{order.phone}</div>
        </div>
        <div className="ad-order-time">{time}</div>
      </div>

      <div className="ad-order-details">
        <span className="ad-tag">{order.protein}</span>
        <span className="ad-tag">{order.plate_size === '3side' ? '3 Sides' : '2 Sides'}</span>
        <span className="ad-tag">Qty {order.quantity}</span>
        <span className="ad-tag">{order.lemonade_flavor} lemonade</span>
      </div>

      {order.sides && order.sides.length > 0 && (
        <div className="ad-order-sides">Sides: {order.sides.join(', ')}</div>
      )}

      {(order.extra_lemonade_count > 0 || order.cake_slice_count > 0) && (
        <div className="ad-order-addons">
          {order.extra_lemonade_count > 0 && <span>+{order.extra_lemonade_count} extra lemonade</span>}
          {order.cake_slice_count > 0 && <span>+{order.cake_slice_count} cake slice</span>}
        </div>
      )}

      {order.special_instructions && (
        <div className="ad-order-instructions">"{order.special_instructions}"</div>
      )}

      <div className="ad-order-bottom">
        <div className="ad-order-total">{formatMoney(Number(order.order_total) || 0)}</div>

        <div className="ad-order-controls">
          <button className={`ad-paid-toggle ${order.paid ? 'ad-paid-on' : ''}`} onClick={onTogglePaid}>
            {order.paid ? 'Paid' : 'Mark paid'}
          </button>

          <select
            className="ad-status-select"
            value={order.status || 'New'}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button className="ad-archive-toggle" onClick={onToggleArchived}>
            {order.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}
