import type { CurrencyCode, ExchangeRate } from './types'

const rateCacheKey = (currency: CurrencyCode) => `travelcalc:rate:${currency}`

type FrankfurterResponse = {
  date: string
  base: string
  quote: string
  rate: number
}

export function cachedRate(currency: CurrencyCode = 'KRW'): ExchangeRate | null {
  try {
    const stored = localStorage.getItem(rateCacheKey(currency)) ?? (currency === 'KRW' ? localStorage.getItem('travelcalc:rate') : null)
    if (!stored) return null
    const parsed = JSON.parse(stored) as ExchangeRate
    return Number.isFinite(parsed.rate) ? { ...parsed, source: 'cached' } : null
  } catch {
    return null
  }
}

export async function fetchTwdRate(currency: CurrencyCode): Promise<ExchangeRate> {
  const response = await fetch(`https://api.frankfurter.dev/v2/rate/TWD/${currency}`)
  if (!response.ok) throw new Error('匯率服務暫時無法使用')

  const data = (await response.json()) as FrankfurterResponse
  if (!Number.isFinite(data.rate) || data.rate <= 0) throw new Error('匯率資料格式錯誤')

  const rate: ExchangeRate = {
    currency,
    rate: data.rate,
    date: data.date,
    fetchedAt: new Date().toISOString(),
    source: 'live',
  }
  localStorage.setItem(rateCacheKey(currency), JSON.stringify(rate))
  return rate
}

export function saveManualRate(rate: number, currency: CurrencyCode): ExchangeRate {
  const value: ExchangeRate = {
    currency,
    rate,
    date: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: 'manual',
  }
  localStorage.setItem(rateCacheKey(currency), JSON.stringify(value))
  return value
}
