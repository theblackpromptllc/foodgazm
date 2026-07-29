import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { SIDES, calculateTotal, formatMoney } from '../lib/pricing.js'
import './CustomerOrder.css'

const initialState = {
  customerName: '',
  phone: '',
  protein: '',
  plateSize: '',
  sides: [],
  lemonadeFlavor: '',
  quantity: 1,
  extraLemonadeCount: 0,
  cakeSliceCount: 0,
  specialInstructions: '',
}

export default function CustomerOrder() {
  const [form, setForm] = useState(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmedTotal, setConfirmedTotal] = useState(null)

  const total = useMemo(() => calculateTotal(form), [form])

  const maxSides = form.plateSize === '3side' ? 3 : form.plateSize === '2side' ? 2 : 0

  function selectPlateSize(size) {
    setForm((f) => ({
      ...f,
      plateSize: size,
      sides: size === '3side' ? [...SIDES] : f.sides.slice(0, 2),
    }))
  }

  function toggleSide(side) {
    if (form.plateSize === '3side') return
    setForm((f) => {
      const has = f.sides.includes(side)
      if (has) {
        return { ...f, sides: f.sides.filter((s) => s !== side) }
      }
      if (f.sides.length >= 2) {
        return f
      }
      return { ...f, sides: [...f.sides, side] }
    })
  }

  function updateCount(field, delta, min = 0) {
    setForm((f) => ({ ...f, [field]: Math.max(min, f[field] + delta) }))
  }

  function isValid() {
    if (!form.customerName.trim()) return false
    if (!form.phone.trim()) return false
    if (!form.protein) return false
    if (!form.plateSize) return false
    if (form.sides.length !== maxSides) return false
    if (!form.lemonadeFlavor) return false
    if (form.quantity < 1) return false
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isValid()) {
      setError('Please fill in every field and pick your sides before placing your order.')
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('orders').insert({
      customer_name: form.customerName.trim(),
      phone: form.phone.trim(),
      protein: form.protein,
      plate_size: form.plateSize,
      sides: form.sides,
      lemonade_flavor: form.lemonadeFlavor,
      quantity: form.quantity,
      extra_lemonade_count: form.extraLemonadeCount,
      cake_slice_count: form.cakeSliceCount,
      special_instructions: form.specialInstructions.trim(),
      order_total: total,
    })
    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong sending your order. Please try again in a moment.')
      return
    }

    setConfirmedTotal(total)
    setForm(initialState)
  }

  if (confirmedTotal !== null) {
    return (
      <div className="fg-wrap">
        <div className="fg-confirm">
          <h1 className="fg-title">FOODGAZM</h1>
          <div className="fg-confirm-card">
            <div className="fg-confirm-emoji">🔥</div>
            <h2>Order received!</h2>
            <p className="fg-confirm-text">Nakia will text you about pickup.</p>
            <div className="fg-confirm-total">{formatMoney(confirmedTotal)}</div>
            <p className="fg-confirm-pay">Pay by Cash App or Apple Pay when you get your text.</p>
            <button className="fg-btn fg-btn-primary" onClick={() => setConfirmedTotal(null)}>
              Place another order
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fg-wrap">
      <header className="fg-hero">
        <h1 className="fg-title">FOODGAZM</h1>
        <p className="fg-tagline">Weekend plates that hit different.</p>
      </header>

      <form className="fg-form" onSubmit={handleSubmit}>
        <section className="fg-section">
          <label className="fg-label" htmlFor="customerName">
            Your name
          </label>
          <input
            id="customerName"
            className="fg-input"
            type="text"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Full name"
          />

          <label className="fg-label" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            className="fg-input"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="For pickup texts"
          />
        </section>

        <section className="fg-section">
          <h3 className="fg-section-title">Pick your protein</h3>
          <div className="fg-btn-row">
            <button
              type="button"
              className={`fg-choice ${form.protein === 'Jerk Chicken' ? 'fg-choice-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, protein: 'Jerk Chicken' }))}
            >
              Jerk Chicken
            </button>
            <button
              type="button"
              className={`fg-choice ${form.protein === 'Curry Chicken' ? 'fg-choice-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, protein: 'Curry Chicken' }))}
            >
              Curry Chicken
            </button>
          </div>
        </section>

        <section className="fg-section">
          <h3 className="fg-section-title">Pick your plate</h3>
          <div className="fg-btn-row">
            <button
              type="button"
              className={`fg-choice ${form.plateSize === '2side' ? 'fg-choice-active' : ''}`}
              onClick={() => selectPlateSize('2side')}
            >
              2 Sides
              <span className="fg-choice-price">$15</span>
            </button>
            <button
              type="button"
              className={`fg-choice ${form.plateSize === '3side' ? 'fg-choice-active' : ''}`}
              onClick={() => selectPlateSize('3side')}
            >
              3 Sides
              <span className="fg-choice-price">$20</span>
            </button>
          </div>
        </section>

        {form.plateSize && (
          <section className="fg-section">
            <h3 className="fg-section-title">
              {form.plateSize === '3side' ? 'Your sides (all included)' : 'Pick 2 sides'}
            </h3>
            <div className="fg-sides">
              {SIDES.map((side) => (
                <button
                  type="button"
                  key={side}
                  className={`fg-side ${form.sides.includes(side) ? 'fg-side-active' : ''} ${form.plateSize === '3side' ? 'fg-side-locked' : ''}`}
                  onClick={() => toggleSide(side)}
                  disabled={form.plateSize === '3side'}
                >
                  {side}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="fg-section">
          <h3 className="fg-section-title">Lemonade flavor (free with your plate)</h3>
          <div className="fg-btn-row">
            <button
              type="button"
              className={`fg-choice ${form.lemonadeFlavor === 'Regular' ? 'fg-choice-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, lemonadeFlavor: 'Regular' }))}
            >
              Regular
            </button>
            <button
              type="button"
              className={`fg-choice ${form.lemonadeFlavor === 'Strawberry' ? 'fg-choice-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, lemonadeFlavor: 'Strawberry' }))}
            >
              Strawberry
            </button>
          </div>
        </section>

        <section className="fg-section">
          <h3 className="fg-section-title">How many plates</h3>
          <div className="fg-stepper">
            <button type="button" className="fg-stepper-btn" onClick={() => updateCount('quantity', -1, 1)}>
              −
            </button>
            <span className="fg-stepper-value">{form.quantity}</span>
            <button type="button" className="fg-stepper-btn" onClick={() => updateCount('quantity', 1, 1)}>
              +
            </button>
          </div>
        </section>

        <section className="fg-section">
          <h3 className="fg-section-title">Add-ons</h3>
          <div className="fg-addon-row">
            <div className="fg-addon-label">
              Extra Lemonade 16 oz <span className="fg-addon-price">$3.50 each</span>
            </div>
            <div className="fg-stepper fg-stepper-sm">
              <button type="button" className="fg-stepper-btn" onClick={() => updateCount('extraLemonadeCount', -1)}>
                −
              </button>
              <span className="fg-stepper-value">{form.extraLemonadeCount}</span>
              <button type="button" className="fg-stepper-btn" onClick={() => updateCount('extraLemonadeCount', 1)}>
                +
              </button>
            </div>
          </div>
          <div className="fg-addon-row">
            <div className="fg-addon-label">
              7Up Pound Cake slice <span className="fg-addon-price">$3.00 each</span>
            </div>
            <div className="fg-stepper fg-stepper-sm">
              <button type="button" className="fg-stepper-btn" onClick={() => updateCount('cakeSliceCount', -1)}>
                −
              </button>
              <span className="fg-stepper-value">{form.cakeSliceCount}</span>
              <button type="button" className="fg-stepper-btn" onClick={() => updateCount('cakeSliceCount', 1)}>
                +
              </button>
            </div>
          </div>
        </section>

        <section className="fg-section">
          <label className="fg-label" htmlFor="specialInstructions">
            Special instructions
          </label>
          <textarea
            id="specialInstructions"
            className="fg-textarea"
            rows={3}
            value={form.specialInstructions}
            onChange={(e) => setForm((f) => ({ ...f, specialInstructions: e.target.value }))}
            placeholder="Allergies, extra spicy, anything we should know"
          />
        </section>

        <div className="fg-total-bar">
          <span>Order total</span>
          <span className="fg-total-amount">{formatMoney(total)}</span>
        </div>

        {error && <div className="fg-error">{error}</div>}

        <button type="submit" className="fg-btn fg-btn-primary fg-submit" disabled={submitting}>
          {submitting ? 'Sending order...' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
