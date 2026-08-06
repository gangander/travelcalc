export type CurrencyCode = 'TWD' | 'KRW'

export type ExchangeRate = {
  rate: number
  date: string
  fetchedAt: string
  source: 'live' | 'cached' | 'manual'
}

export type ConversionRecord = {
  id: string
  from: CurrencyCode
  to: CurrencyCode
  amount: number
  result: number
  rate: number
  createdAt: string
}

export type Expense = {
  id: string
  title: string
  amount: number
  currency: CurrencyCode
  twdAmount: number
  category: string
  createdAt: string
}

export type Trip = {
  id: string
  name: string
  destination: string
  startDate: string
  expenses: Expense[]
}

export type CardSettings = {
  name: string
  feePercent: number
  rewardPercent: number
}
