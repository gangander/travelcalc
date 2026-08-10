import { useEffect, useState } from 'react'
import {
  ArrowDownUp, CalendarDays, Check, CircleDollarSign, Clock3, CreditCard, Heart,
  History, Laptop, Moon, MoreHorizontal, Plane, Plus, ReceiptText, RefreshCw, Settings2, ShoppingBag, Smartphone, Sparkles, Sun, Trash2, WalletCards, X,
} from 'lucide-react'
import { cachedRate, fetchTwdRate, saveManualRate } from './rate-service'
import { loadStored, saveStored } from './storage'
import type { CardSettings, ConversionRecord, CurrencyCode, ExchangeRate, Expense, SavedProduct, Trip } from './types'

type Currency = { code: CurrencyCode; symbol: string; flag: string; name: string }
type DestinationId = 'kr' | 'jp' | 'th' | 'us' | 'sg' | 'eu'
type Destination = { id: DestinationId; country: string; flag: string; currency: Currency }
type Tab = 'convert' | 'shop' | 'trips' | 'wallet'
type Sheet = 'settings' | 'history' | 'expense' | 'trip' | null
type ThemePreference = 'system' | 'light' | 'dark'
type PaymentMethodId = 'card' | 'apple-pay' | 'google-wallet' | 'samsung-wallet' | 'line-pay' | 'kakao-pay' | 'naver-pay'
type PaymentMethod = { id: PaymentMethodId; name: string; status: 'recommended' | 'conditional' | 'not-recommended'; note: string; officialUrl?: string }

const TWD: Currency = { code: 'TWD', symbol: 'NT$', flag: '🇹🇼', name: '新台幣' }
const KRW: Currency = { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: '韓元' }
const JPY: Currency = { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: '日圓' }
const THB: Currency = { code: 'THB', symbol: '฿', flag: '🇹🇭', name: '泰銖' }
const USD: Currency = { code: 'USD', symbol: 'US$', flag: '🇺🇸', name: '美元' }
const SGD: Currency = { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: '新加坡幣' }
const EUR: Currency = { code: 'EUR', symbol: '€', flag: '🇪🇺', name: '歐元' }
const DESTINATIONS: Destination[] = [
  { id: 'kr', country: '韓國', flag: '🇰🇷', currency: KRW },
  { id: 'jp', country: '日本', flag: '🇯🇵', currency: JPY },
  { id: 'th', country: '泰國', flag: '🇹🇭', currency: THB },
  { id: 'us', country: '美國', flag: '🇺🇸', currency: USD },
  { id: 'sg', country: '新加坡', flag: '🇸🇬', currency: SGD },
  { id: 'eu', country: '歐元區', flag: '🇪🇺', currency: EUR },
]
const CURRENCIES = [TWD, KRW, JPY, THB, USD, SGD, EUR]
const currencyByCode = (code: CurrencyCode) => CURRENCIES.find((currency) => currency.code === code) ?? TWD
const DEFAULT_RATES: Record<Exclude<CurrencyCode, 'TWD'>, number> = { KRW: 45.32, JPY: 4.7, THB: 1.08, USD: 0.031, SGD: 0.04, EUR: 0.026 }
const defaultRate = (currency: CurrencyCode): ExchangeRate => ({ currency, rate: currency === 'TWD' ? 1 : DEFAULT_RATES[currency], date: '', fetchedAt: '', source: 'cached' })
const DEFAULT_TRIP: Trip = { id: 'seoul', name: '首爾自由行', destination: '首爾', startDate: new Date().toISOString().slice(0, 10), expenses: [] }
const CARD_PRESETS: CardSettings[] = [
  { bank: '國泰世華', presetId: 'cube-l1', name: 'CUBE｜趣旅行 Level 1', feePercent: 1.5, rewardPercent: 2, note: '需在 CUBE App 切換「趣旅行」。此選項以 Level 1 的 2% 試算，實際等級及指定通路以 App 顯示為準。', officialUrl: 'https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/product/CUBE_rights/index.html', verifiedAt: '2026-08-06' },
  { bank: '國泰世華', presetId: 'cube-l2', name: 'CUBE｜趣旅行 Level 2', feePercent: 1.5, rewardPercent: 3, note: '需在 CUBE App 切換「趣旅行」，並符合 Level 2 資格。以指定旅遊與海外通路 3% 試算。', officialUrl: 'https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/product/CUBE_rights/index.html', verifiedAt: '2026-08-06' },
  { bank: '國泰世華', presetId: 'cube-l3', name: 'CUBE｜趣旅行 Level 3', feePercent: 1.5, rewardPercent: 3.3, note: '需在 CUBE App 切換「趣旅行」，並符合 Level 3 資格。以指定旅遊與海外通路 3.3% 試算。', officialUrl: 'https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/product/CUBE_rights/index.html', verifiedAt: '2026-08-06' },
  { bank: '台新銀行', presetId: 'richart-travel', name: 'Richart 卡｜玩旅刷', feePercent: 1.5, rewardPercent: 3.3, note: '需在 Richart Life App 切換「玩旅刷」，並完成 Richart 帳戶自動扣繳等指定條件；不含銀行排除交易。', officialUrl: 'https://richart.tw/TSDIB_RichartWeb/card/credit-card', verifiedAt: '2026-08-06' },
  { bank: '玉山銀行', presetId: 'unicard-base', name: 'Unicard｜一般消費', feePercent: 1.5, rewardPercent: 1, note: '以一般消費最高 1% 試算。UP 選、任意選或限時活動可能較高，但通常有登錄、名額及回饋上限，因此不灌入基本試算。', officialUrl: 'https://event.esunbank.com.tw/credit/unicard/index.html', verifiedAt: '2026-08-06' },
  { bank: '台北富邦', presetId: 'fubon-j-jkt', name: 'J 卡｜日韓泰一般消費', feePercent: 1.5, rewardPercent: 3, note: '日本、韓國、泰國一般消費最高 3%，活動期間與基本回饋資格依官網。限量登錄加碼不列入試算。', officialUrl: 'https://www.fubon.com/banking/personal/credit_card/all_card/omiyage/omiyage.htm', verifiedAt: '2026-08-06' },
  { bank: '中國信託', presetId: 'ctbc-linepay-overseas', name: 'LINE Pay 卡｜海外實體', feePercent: 1.5, rewardPercent: 2.8, note: '海外實體商店消費以 2.8% LINE POINTS 試算；網購、代收與銀行排除交易不適用。每週登錄限量加碼未列入。', officialUrl: 'https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html', verifiedAt: '2026-08-06' },
  { bank: '永豐銀行', presetId: 'sinopac-dawho-big', name: 'DAWHO 現金回饋卡｜大戶', feePercent: 1.5, rewardPercent: 3, note: '以「大戶」等級海外消費 3% 試算；須持 DAWHO 數位帳戶並符合指定資產或任務條件。Plus 等級及限時加碼未列入。', officialUrl: 'https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/DAWHO.html', verifiedAt: '2026-08-06' },
  { bank: '星展銀行', presetId: 'dbs-eco-designated', name: 'eco 永續卡｜指定國家', feePercent: 1.5, rewardPercent: 5, note: '日本、韓國、泰國、新加坡及美洲等指定國家最高 5%；加碼部分每期帳單有回饋上限，超過後按一般回饋計算。', officialUrl: 'https://www.dbs.com.tw/personal-zh/cards/credit-cards/dbs-eco-card', verifiedAt: '2026-08-06' },
  { bank: '滙豐銀行', presetId: 'hsbc-cashback-overseas', name: '現金回饋御璽卡｜海外', feePercent: 1.5, rewardPercent: 2.22, note: '海外消費 2.22% 現金回饋、回饋無上限；是否屬海外交易仍依滙豐認定及商店收單地為準。', officialUrl: 'https://www.hsbc.com.tw/credit-cards/products/cashback-signature/', verifiedAt: '2026-08-06' },
  { bank: '滙豐銀行', presetId: 'hsbc-liveplus-base', name: 'Live+ 現金回饋卡｜一般消費', feePercent: 1.5, rewardPercent: 0.88, note: '以一般消費 0.88% 試算。指定餐飲、購物、娛樂通路最高 3.88%，但加碼有每期上限，因此未直接套用。', officialUrl: 'https://www.hsbc.com.tw/credit-cards/products/liveplus/', verifiedAt: '2026-08-06' },
  { bank: '其他', presetId: 'custom', name: '其他／自訂卡片', feePercent: 1.5, rewardPercent: 2, note: '自行輸入銀行公告的海外回饋與手續費。' },
]
const CARD_BANKS = [...new Set(CARD_PRESETS.map((card) => card.bank ?? '其他'))]
const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: '實體信用卡', status: 'recommended', note: '接受度通常最高，回饋與海外手續費直接依發卡銀行認列。' },
  { id: 'apple-pay', name: 'Apple Pay', status: 'recommended', note: '韓國支援 Apple Pay 的感應商店可使用；通常保留綁定卡片的回饋與權益，仍以銀行認列為準。', officialUrl: 'https://support.apple.com/zh-tw/102775' },
  { id: 'google-wallet', name: 'Google Wallet', status: 'recommended', note: '可在支援感應付款的商店使用，須確認手機、地區及綁定卡片受支援；回饋依銀行認列。', officialUrl: 'https://support.google.com/wallet/answer/12060037' },
  { id: 'samsung-wallet', name: 'Samsung Wallet', status: 'recommended', note: '韓國列於官方支援地區；若綁定卡可在當地交易，通常可用 Samsung Wallet 感應付款。', officialUrl: 'https://www.samsung.com/tw/samsung-pay/' },
  { id: 'line-pay', name: 'LINE Pay', status: 'conditional', note: '僅限接受 LINE Pay 的海外合作店，使用綁定信用卡付款；海外不能使用 LINE POINTS、優惠券或一卡通 MONEY。', officialUrl: 'https://help2.line.me/linepay_tw?contentId=50012192&country=TW' },
  { id: 'kakao-pay', name: 'Kakao Pay', status: 'not-recommended', note: '韓國當地常見，但一般台灣旅客可能受韓國電話、帳戶或身分驗證限制，不建議當唯一付款方式。' },
  { id: 'naver-pay', name: 'NAVER Pay', status: 'not-recommended', note: '韓國部分線上與實體通路常見，但海外旅客註冊與付款條件較多，建議只作備用。' },
]
const cardAppliesTo = (card: CardSettings, destinationId: DestinationId) => {
  if (card.presetId === 'fubon-j-jkt') return ['kr', 'jp', 'th'].includes(destinationId)
  if (card.presetId === 'dbs-eco-designated') return ['kr', 'jp', 'th', 'us', 'sg'].includes(destinationId)
  return true
}
const paymentAppliesTo = (method: PaymentMethod, destinationId: DestinationId) => {
  if (method.id === 'line-pay') return destinationId !== 'jp'
  if (method.id === 'kakao-pay' || method.id === 'naver-pay') return destinationId === 'kr'
  return true
}
const DEFAULT_CARD: CardSettings = CARD_PRESETS[0]
const numberFormat = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 })
const moneyFormat = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 })
const cleanNumber = (value: string) => value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function App() {
  const [tab, setTab] = useState<Tab>('convert')
  const [sheet, setSheet] = useState<Sheet>(null)
  const [destinationId, setDestinationId] = useState<DestinationId>(() => loadStored('travelcalc:destination', 'kr'))
  const destination = DESTINATIONS.find((item) => item.id === destinationId) ?? DESTINATIONS[0]
  const [from, setFrom] = useState<Currency>(() => destination.currency)
  const [to, setTo] = useState<Currency>(TWD)
  const [amount, setAmount] = useState('1000')
  const [rate, setRate] = useState<ExchangeRate>(() => cachedRate(destination.currency.code) ?? defaultRate(destination.currency.code))
  const [rateDraft, setRateDraft] = useState(String(rate.rate))
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState('')
  const [records, setRecords] = useState<ConversionRecord[]>(() => loadStored('travelcalc:records', []))
  const [trips, setTrips] = useState<Trip[]>(() => loadStored('travelcalc:trips', [DEFAULT_TRIP]))
  const [activeTripId, setActiveTripId] = useState(() => loadStored('travelcalc:activeTrip', 'seoul'))
  const [card, setCard] = useState<CardSettings>(() => {
    const saved = loadStored<CardSettings>('travelcalc:card', DEFAULT_CARD)
    if (!saved.presetId || saved.presetId === 'custom') return saved
    return CARD_PRESETS.find((preset) => preset.presetId === saved.presetId) ?? saved
  })
  const [paymentMethodId, setPaymentMethodId] = useState<PaymentMethodId>(() => loadStored('travelcalc:paymentMethod', 'card'))
  const [products, setProducts] = useState<SavedProduct[]>(() => loadStored('travelcalc:products', []))
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState<ThemePreference>(() => loadStored('travelcalc:theme', 'system'))

  const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? trips[0]
  const numericAmount = Number(amount) || 0
  const converted = from.code === 'TWD' ? numericAmount * rate.rate : numericAmount / rate.rate
  const cardBaseTwd = from.code === 'TWD' ? numericAmount : converted
  const cardFee = cardBaseTwd * card.feePercent / 100
  const cardReward = cardBaseTwd * card.rewardPercent / 100
  const cardNet = cardBaseTwd + cardFee - cardReward

  useEffect(() => { saveStored('travelcalc:records', records) }, [records])
  useEffect(() => { saveStored('travelcalc:trips', trips) }, [trips])
  useEffect(() => { saveStored('travelcalc:activeTrip', activeTripId) }, [activeTripId])
  useEffect(() => { saveStored('travelcalc:card', card) }, [card])
  useEffect(() => { saveStored('travelcalc:paymentMethod', paymentMethodId) }, [paymentMethodId])
  useEffect(() => { saveStored('travelcalc:products', products) }, [products])
  useEffect(() => { saveStored('travelcalc:destination', destinationId) }, [destinationId])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }
    applyTheme()
    saveStored('travelcalc:theme', theme)
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])
  // refreshRate also updates UI state; the destination currency is the only trigger required here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void refreshRate(destination.currency.code) }, [destination.currency.code])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function refreshRate(currency: CurrencyCode = destination.currency.code) {
    setRateLoading(true)
    setRateError('')
    try {
      const latest = await fetchTwdRate(currency)
      setRate(latest)
      setRateDraft(String(latest.rate))
    } catch {
      const cached = cachedRate(currency)
      if (cached) setRate(cached)
      setRateError(cached ? '目前離線，使用上次匯率' : '無法更新，可改用手動匯率')
    } finally {
      setRateLoading(false)
    }
  }

  function selectDestination(id: DestinationId) {
    const selected = DESTINATIONS.find((item) => item.id === id) ?? DESTINATIONS[0]
    setDestinationId(selected.id)
    setFrom(selected.currency)
    setTo(TWD)
    setRate(cachedRate(selected.currency.code) ?? defaultRate(selected.currency.code))
    setRateDraft(String((cachedRate(selected.currency.code) ?? defaultRate(selected.currency.code)).rate))
    if (!cardAppliesTo(card, selected.id)) setCard(DEFAULT_CARD)
    const currentPayment = PAYMENT_METHODS.find((method) => method.id === paymentMethodId) ?? PAYMENT_METHODS[0]
    if (!paymentAppliesTo(currentPayment, selected.id)) setPaymentMethodId('card')
    if (selected.id !== 'kr' && tab === 'shop') setTab('convert')
  }

  function swap() {
    setFrom(to)
    setTo(from)
    setAmount(converted ? String(Number(converted.toFixed(2))) : '')
  }

  function saveConversion() {
    if (!numericAmount) return setToast('請先輸入金額')
    const record: ConversionRecord = { id: newId(), from: from.code, to: to.code, amount: numericAmount, result: converted, rate: rate.rate, createdAt: new Date().toISOString() }
    setRecords((current) => [record, ...current].slice(0, 50))
    setToast('已加入換算紀錄')
  }

  function applyManualRate() {
    const value = Number(rateDraft)
    if (!value || value <= 0) return setToast('請輸入有效匯率')
    setRate(saveManualRate(value, destination.currency.code))
    setRateError('')
    setSheet(null)
    setToast('已使用手動匯率')
  }

  function clearAllData() {
    setRecords([])
    setTrips([DEFAULT_TRIP])
    setActiveTripId(DEFAULT_TRIP.id)
    setCard(DEFAULT_CARD)
    setProducts([])
    setSheet(null)
    setToast('已清除旅行資料')
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="phone-frame">
        <header className="topbar">
          <div><p className="eyebrow"><Plane size={13} /> {destination.country}模式</p><h1>TravelCalc</h1></div>
          <button className="icon-button" onClick={() => setSheet('settings')} aria-label="開啟設定"><MoreHorizontal size={22} /></button>
        </header>
        <div className="destination-picker" aria-label="選擇目的地">{DESTINATIONS.map((item) => <button key={item.id} className={item.id === destination.id ? 'active' : ''} onClick={() => selectDestination(item.id)}><span>{item.flag}</span>{item.country}</button>)}</div>

        {tab === 'convert' && <ConvertView destination={destination} from={from} to={to} amount={amount} converted={converted} rate={rate} loading={rateLoading} error={rateError} onAmount={setAmount} onSwap={swap} onRefresh={refreshRate} onSettings={() => { setRateDraft(String(rate.rate)); setSheet('settings') }} onRecord={saveConversion} onShop={() => setTab('shop')} onWallet={() => setTab('wallet')} onHistory={() => setSheet('history')} />}
        {tab === 'shop' && destination.id === 'kr' && <ShoppingView rate={rate.rate} products={products} onSave={(product) => { setProducts((current) => [product, ...current]); setToast('商品已收藏') }} onDelete={(id) => setProducts((current) => current.filter((product) => product.id !== id))} onExpense={(product) => { if (!activeTrip) return setToast('請先建立旅程'); const total = product.priceKrw * product.quantity; const expense: Expense = { id: newId(), title: product.name, amount: total, currency: 'KRW', twdAmount: total / rate.rate, category: '購物', createdAt: new Date().toISOString() }; setTrips((current) => current.map((trip) => trip.id === activeTrip.id ? { ...trip, expenses: [expense, ...trip.expenses] } : trip)); setToast('已加入旅程花費') }} />}
        {tab === 'trips' && <TripsView trips={trips} activeTripId={activeTripId} rate={rate.rate} onSelect={setActiveTripId} onAdd={() => setSheet('trip')} onExpense={() => setSheet('expense')} />}
        {tab === 'wallet' && <WalletView destination={destination} card={card} setCard={setCard} paymentMethodId={paymentMethodId} setPaymentMethodId={setPaymentMethodId} base={cardBaseTwd} fee={cardFee} reward={cardReward} net={cardNet} amount={numericAmount} from={from} />}

        <nav className="bottom-nav" aria-label="主要導覽">
          <button className={tab === 'convert' ? 'active' : ''} onClick={() => setTab('convert')}><ArrowDownUp size={19} />換算</button>
          {destination.id === 'kr' && <button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}><ShoppingBag size={19} />退稅</button>}
          <button className={tab === 'trips' ? 'active' : ''} onClick={() => setTab('trips')}><Plane size={19} />旅程</button>
          <button className={tab === 'wallet' ? 'active' : ''} onClick={() => setTab('wallet')}><WalletCards size={19} />錢包</button>
        </nav>

        {sheet && <Sheet title={sheetTitle(sheet)} onClose={() => setSheet(null)}>
          {sheet === 'settings' && <Settings currency={destination.currency} rate={rate} rateDraft={rateDraft} setRateDraft={setRateDraft} onManual={applyManualRate} onRefresh={refreshRate} onClear={clearAllData} loading={rateLoading} theme={theme} onTheme={setTheme} />}
          {sheet === 'history' && <HistoryList records={records} onClear={() => setRecords([])} />}
          {sheet === 'expense' && <ExpenseForm trip={activeTrip} currency={destination.currency} rate={rate.rate} onSave={(expense) => { setTrips((current) => current.map((trip) => trip.id === activeTrip?.id ? { ...trip, expenses: [expense, ...trip.expenses] } : trip)); setSheet(null); setToast('花費已記錄') }} />}
          {sheet === 'trip' && <TripForm onSave={(trip) => { setTrips((current) => [...current, trip]); setActiveTripId(trip.id); setSheet(null); setToast('新旅程建立完成') }} />}
        </Sheet>}
        {toast && <div className="toast"><Check size={16} />{toast}</div>}
      </section>
    </main>
  )
}

type ConvertProps = { destination: Destination; from: Currency; to: Currency; amount: string; converted: number; rate: ExchangeRate; loading: boolean; error: string; onAmount: (v: string) => void; onSwap: () => void; onRefresh: () => void; onSettings: () => void; onRecord: () => void; onShop: () => void; onWallet: () => void; onHistory: () => void }
function ConvertView(props: ConvertProps) {
  const sourceLabel = props.rate.source === 'live' ? '即時參考匯率' : props.rate.source === 'manual' ? '手動匯率' : '上次匯率'
  return <>
    <section className="hero-copy"><p>早安，旅人</p><h2>今天想換算<br /><span>多少旅費？</span></h2></section>
    <section className="converter-card" aria-label="貨幣換算器">
      <CurrencyRow currency={props.from} label="支付" value={props.amount} editable onChange={props.onAmount} />
      <div className="divider"><button onClick={props.onSwap} aria-label="交換貨幣"><ArrowDownUp size={18} /></button></div>
      <CurrencyRow currency={props.to} label="可換得" value={numberFormat.format(props.converted)} />
      <div className="rate-bar"><div><Sparkles size={14} /><span>{sourceLabel}</span><strong>1 TWD = {props.rate.rate} {props.destination.currency.code}</strong></div><button onClick={props.onRefresh} disabled={props.loading} aria-label="更新匯率"><RefreshCw size={14} className={props.loading ? 'spin' : ''} /></button><button onClick={props.onSettings}><Settings2 size={14} /> 自訂</button></div>
      <div className="rate-meta"><span>{props.error || (props.rate.date ? `資料日期 ${props.rate.date}` : '準備更新匯率')}</span></div>
    </section>
    <section className="quick-actions">
      {props.destination.id === 'kr' && <button onClick={props.onShop}><span className="action-icon coral"><ShoppingBag size={21} /></span><strong>韓國退稅</strong><small>退稅・收藏</small></button>}
      <button onClick={props.onWallet}><span className="action-icon blue"><CreditCard size={21} /></span><strong>卡片試算</strong><small>回饋・手續費</small></button>
      <button onClick={props.onHistory}><span className="action-icon violet"><History size={21} /></span><strong>換算紀錄</strong><small>最近使用</small></button>
    </section>
    <button className="primary-action" onClick={props.onRecord}><History size={16} />儲存這次換算</button>
  </>
}

function CurrencyRow({ currency, label, value, editable, onChange }: { currency: Currency; label: string; value: string; editable?: boolean; onChange?: (v: string) => void }) {
  return <div className={`currency-row ${editable ? '' : 'result-row'}`}><div className="currency-label"><span className="flag">{currency.flag}</span><div><small>{label}</small><strong>{currency.name}</strong></div></div><div className={`amount-field ${editable ? '' : 'result'}`}><span>{currency.symbol}</span>{editable ? <input aria-label={`${currency.name}金額`} inputMode="decimal" value={value} onChange={(e) => onChange?.(cleanNumber(e.target.value))} /> : <output>{value}</output>}</div></div>
}

function TripsView({ trips, activeTripId, rate, onSelect, onAdd, onExpense }: { trips: Trip[]; activeTripId: string; rate: number; onSelect: (id: string) => void; onAdd: () => void; onExpense: () => void }) {
  return <section className="page-view"><div className="page-heading"><div><p>旅行帳本</p><h2>我的旅程</h2></div><button className="round-add" onClick={onAdd} aria-label="新增旅程"><Plus /></button></div>
    <div className="summary-card"><Plane size={22} /><div><small>所有旅程總花費</small><strong>NT$ {moneyFormat.format(trips.flatMap((trip) => trip.expenses).reduce((sum, expense) => sum + expense.twdAmount, 0))}</strong></div><span>{trips.length} 趟</span></div>
    <div className="section-title"><h3>旅程列表</h3><button onClick={onAdd}>新增</button></div>
    <div className="trip-list">{trips.map((trip) => { const total = trip.expenses.reduce((sum, expense) => sum + expense.twdAmount, 0); return <button key={trip.id} className={`trip-list-item ${trip.id === activeTripId ? 'selected' : ''}`} onClick={() => onSelect(trip.id)}><span className="destination-icon">🇰🇷</span><div><strong>{trip.name}</strong><small><CalendarDays size={11} /> {trip.startDate} · {trip.expenses.length} 筆</small></div><div className="list-amount"><strong>NT$ {moneyFormat.format(total)}</strong><small>約 ₩{moneyFormat.format(total * rate)}</small></div>{trip.id === activeTripId && <Check size={15} />}</button> })}</div>
    <button className="primary-action" onClick={onExpense}><Plus size={17} />新增目前旅程花費</button>
  </section>
}

function ShoppingView({ rate, products, onSave, onDelete, onExpense }: { rate: number; products: SavedProduct[]; onSave: (product: SavedProduct) => void; onDelete: (id: string) => void; onExpense: (product: SavedProduct) => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('50000')
  const [quantity, setQuantity] = useState('1')
  const [refundRate, setRefundRate] = useState('7')
  const totalKrw = (Number(price) || 0) * Math.max(1, Number(quantity) || 1)
  const estimatedRefund = totalKrw * (Number(refundRate) || 0) / 100
  const afterRefund = totalKrw - estimatedRefund
  const eligible = totalKrw >= 15000
  const immediateEligible = eligible && totalKrw < 1_000_000

  function productFromForm(): SavedProduct | null {
    if (!name.trim() || totalKrw <= 0) return null
    return { id: newId(), name: name.trim(), priceKrw: Number(price), quantity: Math.max(1, Number(quantity) || 1), refundRate: Number(refundRate) || 0, createdAt: new Date().toISOString() }
  }

  return <section className="page-view shopping-view">
    <div className="page-heading"><div><p>Korea tax refund</p><h2>購物試算</h2></div><span className="wallet-badge"><ShoppingBag size={19} /></span></div>
    <div className="tax-rule-card"><span className="tax-icon"><ReceiptText size={19} /></span><div><strong>{eligible ? (immediateEligible ? '符合即時退稅金額' : '可申請一般退稅') : '尚未達退稅門檻'}</strong><small>單筆滿 ₩15,000 · 購買後 3 個月內離境</small></div><span className={`eligibility ${eligible ? 'yes' : ''}`}>{eligible ? '符合' : '未達'}</span></div>
    <div className="form-card shopping-form"><label>商品名稱<input placeholder="例如：Olive Young 保養品" value={name} onChange={(e) => setName(e.target.value)} /></label><div className="form-grid"><label>單價 KRW<input inputMode="numeric" value={price} onChange={(e) => setPrice(cleanNumber(e.target.value))} /></label><label>數量<input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(cleanNumber(e.target.value))} /></label></div><label>預估實退比例 (%)<input inputMode="decimal" value={refundRate} onChange={(e) => setRefundRate(cleanNumber(e.target.value))} /></label></div>
    <div className="refund-card"><div className="refund-total"><div><small>商品總額</small><strong>₩ {moneyFormat.format(totalKrw)}</strong><span>約 NT$ {moneyFormat.format(totalKrw / rate)}</span></div><div><small>預估退稅</small><strong className="refund-green">− ₩ {moneyFormat.format(estimatedRefund)}</strong><span>{refundRate}% 試算</span></div></div><div className="after-refund"><span>退稅後約付</span><div><strong>₩ {moneyFormat.format(afterRefund)}</strong><small>NT$ {moneyFormat.format(afterRefund / rate)}</small></div></div></div>
    <div className="shop-actions"><button onClick={() => { const product = productFromForm(); if (product) { onSave(product); setName('') } }} disabled={!name.trim()}><Heart size={16} />收藏商品</button><button className="accent" onClick={() => { const product = productFromForm(); if (product) onExpense(product) }} disabled={!name.trim()}><Plus size={16} />加入花費</button></div>
    <p className="helper-text tax-note">退稅額會因商品、退稅業者與手續費而異。App 預設以售價 7% 估算，可依退稅單自行調整；這不是保證退稅金額。</p>
    <div className="section-title"><h3>收藏商品</h3><span>{products.length} 項</span></div>
    {products.length === 0 ? <EmptyState icon={<Heart />} title="還沒有收藏商品" text="輸入商品名稱與價格，旅行中就能快速比較。" /> : <div className="product-list">{products.map((product) => { const total = product.priceKrw * product.quantity; return <div className="product-item" key={product.id}><span className="product-icon"><ShoppingBag size={17} /></span><div><strong>{product.name}</strong><small>₩{moneyFormat.format(product.priceKrw)} × {product.quantity} · 退稅 {product.refundRate}%</small></div><div className="product-price"><strong>NT$ {moneyFormat.format((total * (1 - product.refundRate / 100)) / rate)}</strong><span><button onClick={() => onExpense(product)} aria-label={`將 ${product.name} 加入花費`}><Plus size={14} /></button><button onClick={() => onDelete(product.id)} aria-label={`刪除 ${product.name}`}><Trash2 size={13} /></button></span></div></div> })}</div>}
  </section>
}

function WalletView({ destination, card, setCard, paymentMethodId, setPaymentMethodId, base, fee, reward, net, amount, from }: { destination: Destination; card: CardSettings; setCard: (card: CardSettings) => void; paymentMethodId: PaymentMethodId; setPaymentMethodId: (id: PaymentMethodId) => void; base: number; fee: number; reward: number; net: number; amount: number; from: Currency }) {
  const paymentMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethodId) ?? PAYMENT_METHODS[0]
  const recommendations = CARD_PRESETS
    .filter((preset) => preset.presetId !== 'custom' && cardAppliesTo(preset, destination.id))
    .map((preset) => ({ ...preset, benefit: base * (preset.rewardPercent - preset.feePercent) / 100 }))
    .sort((a, b) => b.benefit - a.benefit)
    .slice(0, 3)

  return <section className="page-view"><div className="page-heading"><div><p>聰明刷卡</p><h2>錢包試算</h2></div><span className="wallet-badge"><CreditCard size={18} /></span></div>
    <div className="credit-card"><div className="card-top"><span>TRAVEL CARD</span><span>✦</span></div><strong>{card.name}</strong><div className="card-bottom"><span>海外回饋 {card.rewardPercent}%</span><span>•••• 2026</span></div></div>
    <div className="form-card"><label>選擇常用卡片<select value={card.presetId ?? 'custom'} onChange={(e) => { const selected = CARD_PRESETS.find((preset) => preset.presetId === e.target.value); if (selected) setCard(selected) }}>{CARD_BANKS.map((bank) => <optgroup key={bank} label={bank}>{CARD_PRESETS.filter((preset) => (preset.bank ?? '其他') === bank).map((preset) => <option key={preset.presetId} value={preset.presetId} disabled={!cardAppliesTo(preset, destination.id)}>{preset.name}{!cardAppliesTo(preset, destination.id) ? `（不適用${destination.country}）` : ''}</option>)}</optgroup>)}</select></label>{card.presetId === 'custom' && <label>卡片名稱<input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></label>}<div className="form-grid"><label>海外手續費 (%)<input inputMode="decimal" value={card.feePercent} onChange={(e) => setCard({ ...card, presetId: 'custom', bank: '其他', name: card.presetId === 'custom' ? card.name : `${card.name}（自訂）`, feePercent: Number(cleanNumber(e.target.value)) })} /></label><label>回饋試算 (%)<input inputMode="decimal" value={card.rewardPercent} onChange={(e) => setCard({ ...card, presetId: 'custom', bank: '其他', name: card.presetId === 'custom' ? card.name : `${card.name}（自訂）`, rewardPercent: Number(cleanNumber(e.target.value)) })} /></label></div></div>
    {card.note && <div className="card-condition"><Settings2 size={16} /><div><strong>套用條件</strong><p>{card.note}</p>{card.officialUrl && <a href={card.officialUrl} target="_blank" rel="noreferrer">查看銀行官方權益</a>}</div></div>}
    <div className="section-title payment-title"><h3>{destination.country}付款方式</h3><span>不另加固定回饋</span></div>
    <div className="payment-methods">{PAYMENT_METHODS.map((method) => <button key={method.id} disabled={!paymentAppliesTo(method, destination.id)} className={method.id === paymentMethod.id ? 'selected' : ''} onClick={() => setPaymentMethodId(method.id)}><Smartphone size={15} /><span>{method.name}</span></button>)}</div>
    <div className={`payment-advice ${paymentAppliesTo(paymentMethod, destination.id) ? paymentMethod.status : 'not-recommended'}`}><div><strong>{!paymentAppliesTo(paymentMethod, destination.id) ? `目前不適用於${destination.country}` : paymentMethod.status === 'recommended' ? '適合使用' : paymentMethod.status === 'conditional' ? '有條件使用' : '不建議當主要方式'}</strong><p>{paymentAppliesTo(paymentMethod, destination.id) ? paymentMethod.note : `此支付方式未列入 ${destination.country} 的旅客推薦，請改用實體卡或支援的感應支付。`}</p>{paymentMethod.officialUrl && <a href={paymentMethod.officialUrl} target="_blank" rel="noreferrer">查看官方說明</a>}</div></div>
    <div className="section-title card-ranking-title"><h3>{destination.country}刷卡推薦</h3><span>依本次金額估算</span></div>
    <div className="card-ranking">{recommendations.map((preset, index) => <button key={preset.presetId} className={preset.presetId === card.presetId ? 'selected' : ''} onClick={() => setCard(preset)}><span className="rank-number">{index + 1}</span><div><strong>{preset.bank}</strong><small>{preset.name}</small></div><span className={preset.benefit >= 0 ? 'positive' : ''}>{preset.benefit >= 0 ? '省' : '多付'} NT$ {moneyFormat.format(Math.abs(preset.benefit))}</span></button>)}</div>
    <p className="helper-text ranking-note">排行以「回饋率－1.5% 海外手續費」估算，不代表所有交易都符合加碼；請點選卡片查看回饋上限與使用條件。</p>
    <div className="calc-card"><div className="calc-header"><div><small>本次消費</small><strong>{from.symbol} {numberFormat.format(amount)}</strong></div><CircleDollarSign /></div><div className="calc-line"><span>折合台幣</span><strong>NT$ {moneyFormat.format(base)}</strong></div><div className="calc-line fee"><span>海外手續費</span><strong>+ NT$ {moneyFormat.format(fee)}</strong></div><div className="calc-line reward"><span>預估回饋</span><strong>− NT$ {moneyFormat.format(reward)}</strong></div><div className="calc-total"><span>實際成本</span><strong>NT$ {moneyFormat.format(net)}</strong></div></div>
    <p className="helper-text">權益資料核對日：{card.verifiedAt ?? '自訂'}。試算不含登錄活動、回饋上限與排除項目，實際結果依銀行認列。</p>
  </section>
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="sheet"><div className="sheet-handle" /><header><h2>{title}</h2><button onClick={onClose} aria-label="關閉"><X size={20} /></button></header>{children}</section></div> }
function sheetTitle(sheet: Exclude<Sheet, null>) { return { settings: '匯率與設定', history: '換算紀錄', expense: '新增旅費', trip: '建立旅程' }[sheet] }

function Settings({ currency, rate, rateDraft, setRateDraft, onManual, onRefresh, onClear, loading, theme, onTheme }: { currency: Currency; rate: ExchangeRate; rateDraft: string; setRateDraft: (v: string) => void; onManual: () => void; onRefresh: () => void; onClear: () => void; loading: boolean; theme: ThemePreference; onTheme: (theme: ThemePreference) => void }) {
  return <div className="sheet-content"><div className="theme-setting"><div><strong>外觀</strong><small>可跟隨手機的顯示模式</small></div><div className="theme-picker" role="group" aria-label="外觀模式"><button className={theme === 'system' ? 'active' : ''} onClick={() => onTheme('system')} aria-pressed={theme === 'system'}><Laptop size={15} />自動</button><button className={theme === 'light' ? 'active' : ''} onClick={() => onTheme('light')} aria-pressed={theme === 'light'}><Sun size={15} />淺色</button><button className={theme === 'dark' ? 'active' : ''} onClick={() => onTheme('dark')} aria-pressed={theme === 'dark'}><Moon size={15} />深色</button></div></div><div className="setting-status"><span className={`status-dot ${rate.source}`} /><div><strong>{rate.source === 'live' ? '已連線自動匯率' : rate.source === 'manual' ? '目前使用手動匯率' : '目前使用快取匯率'}</strong><small>Frankfurter 官方參考匯率 · {rate.date || '尚未更新'}</small></div><button onClick={onRefresh} disabled={loading}><RefreshCw size={17} className={loading ? 'spin' : ''} /></button></div><div className="form-card"><label>手動設定 1 TWD 可換多少 {currency.code}<div className="inline-input"><input inputMode="decimal" value={rateDraft} onChange={(e) => setRateDraft(cleanNumber(e.target.value))} /><button onClick={onManual}>套用</button></div></label></div><p className="helper-text">有網路時會自動更新；更新失敗會保留這個幣別上次成功的匯率。銀行現鈔或信用卡入帳匯率可能不同。</p><button className="danger-button" onClick={onClear}><Trash2 size={16} />清除所有旅行資料</button></div>
}

function HistoryList({ records, onClear }: { records: ConversionRecord[]; onClear: () => void }) {
  return <div className="sheet-content">{records.length === 0 ? <EmptyState icon={<History />} title="還沒有換算紀錄" text="回到首頁儲存一次換算，就會出現在這裡。" /> : <><div className="history-list">{records.map((record) => <div className="history-item" key={record.id}><span className="history-icon"><ArrowDownUp size={16} /></span><div><strong>{currencyByCode(record.from).symbol} {numberFormat.format(record.amount)}</strong><small><Clock3 size={11} /> {new Date(record.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div><div><strong>{currencyByCode(record.to).symbol} {numberFormat.format(record.result)}</strong><small>匯率 {record.rate}</small></div></div>)}</div><button className="danger-button" onClick={onClear}><Trash2 size={16} />清除換算紀錄</button></>}</div>
}

function ExpenseForm({ trip, currency: destinationCurrency, rate, onSave }: { trip?: Trip; currency: Currency; rate: number; onSave: (expense: Expense) => void }) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>(destinationCurrency.code)
  const [category, setCategory] = useState('餐飲')
  const valid = title.trim() && Number(amount) > 0 && trip
  return <div className="sheet-content"><div className="current-trip"><Plane size={18} /><div><small>加入旅程</small><strong>{trip?.name ?? '尚未建立旅程'}</strong></div></div><div className="form-card"><label>項目名稱<input autoFocus placeholder="例如：當地市場午餐" value={title} onChange={(e) => setTitle(e.target.value)} /></label><div className="form-grid"><label>金額<input inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(cleanNumber(e.target.value))} /></label><label>幣別<select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}><option value={destinationCurrency.code}>{destinationCurrency.name} {destinationCurrency.code}</option><option value="TWD">台幣 TWD</option></select></label></div><label>分類<select value={category} onChange={(e) => setCategory(e.target.value)}>{['餐飲', '購物', '交通', '住宿', '景點', '其他'].map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="expense-preview"><span>折合約</span><strong>NT$ {moneyFormat.format(currency === 'TWD' ? Number(amount) : Number(amount) / rate)}</strong></div><button className="primary-action" disabled={!valid} onClick={() => valid && onSave({ id: newId(), title: title.trim(), amount: Number(amount), currency, twdAmount: currency === 'TWD' ? Number(amount) : Number(amount) / rate, category, createdAt: new Date().toISOString() })}><Plus size={17} />儲存這筆花費</button></div>
}

function TripForm({ onSave }: { onSave: (trip: Trip) => void }) {
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('首爾')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return <div className="sheet-content"><div className="form-card"><label>旅程名稱<input autoFocus placeholder="例如：2026 首爾自由行" value={name} onChange={(e) => setName(e.target.value)} /></label><label>目的地<input value={destination} onChange={(e) => setDestination(e.target.value)} /></label><label>出發日期<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div><button className="primary-action" disabled={!name.trim() || !destination.trim()} onClick={() => onSave({ id: newId(), name: name.trim(), destination: destination.trim(), startDate: date, expenses: [] })}><Plane size={17} />建立新旅程</button></div>
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div> }

export default App
