export const PLATE_PRICES = {
  '2side': 15,
  '3side': 20,
}

export const EXTRA_LEMONADE_PRICE = 3.5
export const CAKE_SLICE_PRICE = 3.0

export const SIDES = ['Rice and Peas', 'Cabbage', 'Mac and Cheese']

export function calculateTotal({ plateSize, quantity, extraLemonadeCount, cakeSliceCount }) {
  const platePrice = PLATE_PRICES[plateSize] ?? 0
  const total =
    platePrice * quantity +
    EXTRA_LEMONADE_PRICE * extraLemonadeCount +
    CAKE_SLICE_PRICE * cakeSliceCount
  return Math.round(total * 100) / 100
}

export function formatMoney(amount) {
  return `$${amount.toFixed(2)}`
}
