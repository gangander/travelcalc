import type { CurrencyCode, ExchangeRate } from './types'

const rateCacheKey = (currency: CurrencyCode) => `travelcalc:rate:${currency}`
const SUPPORTED_QUOTES: CurrencyCode[] = ['KRW', 'JPY', 'THB', 'USD', 'SGD', 'EUR']
const API_BASE = 'https://api.frankfurter.dev/v2'

type FrankfurterResponse = {
  date: string
  base: string
  quote: string
  rate: number
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json() as unknown
  } finally {
    window.clearTimeout(timer)
  }
}

function storeRate(data: FrankfurterResponse): ExchangeRate {
  if (!SUPPORTED_QUOTES.includes(data.quote as CurrencyCode) || !Number.isFinite(data.rate) || data.rate <= 0) {
    throw new Error('匯率資料格式錯誤')
  }
  const currency = data.quote as CurrencyCode
  const rate: ExchangeRate = { currency, rate: data.rate, date: data.date, fetchedAt: new Date().toISOString(), source: 'live' }
  localStorage.setItem(rateCacheKey(currency), JSON.stringify(rate))
  return rate
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
  if (currency === 'TWD') return { currency, rate: 1, date: new Date().toISOString().slice(0, 10), fetchedAt: new Date().toISOString(), source: 'live' }

  try {
    const quotes = SUPPORTED_QUOTES.join(',')
    const data = await fetchJson(`${API_BASE}/rates?base=TWD&quotes=${quotes}`)
    if (!Array.isArray(data)) throw new Error('批次匯率格式錯誤')
    const rates = data.map((item) => storeRate(item as FrankfurterResponse))
    const selected = rates.find((item) => item.currency === currency)
    if (!selected) throw new Error(`找不到 ${currency} 匯率`)
    return selected
  } catch {
    const data = await fetchJson(`${API_BASE}/rate/TWD/${currency}`) as FrankfurterResponse
    return storeRate(data)
  }
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
