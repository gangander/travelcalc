import { loadStored } from './storage'
import type { CurrencyCode, SavedProduct } from './types'

type LegacySavedProduct = Omit<SavedProduct, 'price' | 'currency'> & {
  price?: number
  priceKrw?: number
  currency?: CurrencyCode
}

export function loadSavedProducts(): SavedProduct[] {
  return loadStored<LegacySavedProduct[]>('travelcalc:products', []).map((product) => ({
    ...product,
    price: product.price ?? product.priceKrw ?? 0,
    currency: product.currency ?? 'KRW',
  }))
}
