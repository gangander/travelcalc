import type { ExchangeRate } from './types'

const RATE_CACHE_KEY = 'travelcalc:rate'

type FrankfurterResponse = {
  date: string
  base: string
  quote: string
  rate: number
}

export function cachedRate(): ExchangeRate | null {
  try {
    const stored = localStorage.getItem(RATE_CACHE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as ExchangeRate
    return Number.isFinite(parsed.rate) ? { ...parsed, source: 'cached' } : null
  } catch {
    return null
  }
}

export async function fetchTwdKrwRate(): Promise<ExchangeRate> {
  const response = await fetch('https://api.frankfurter.dev/v2/rate/TWD/KRW')
  if (!response.ok) throw new Error('匯率服務暫時無法使用')

  const data = (await response.json()) as FrankfurterResponse
  if (!Number.isFinite(data.rate) || data.rate <= 0) throw new Error('匯率資料格式錯誤')

  const rate: ExchangeRate = {
    rate: data.rate,
    date: data.date,
    fetchedAt: new Date().toISOString(),
    source: 'live',
  }
  localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(rate))
  return rate
}

export function saveManualRate(rate: number): ExchangeRate {
  const value: ExchangeRate = {
    rate,
    date: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: 'manual',
  }
  localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(value))
  return value
}
