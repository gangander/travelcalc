import { useMemo, useState } from 'react'
import { ArrowDownUp, ChevronRight, History, MoreHorizontal, Plane, Plus, Settings2, Sparkles, WalletCards } from 'lucide-react'

type Currency = {
  code: 'TWD' | 'KRW'
  symbol: string
  flag: string
  name: string
}

const TWD: Currency = { code: 'TWD', symbol: 'NT$', flag: '🇹🇼', name: '新台幣' }
const KRW: Currency = { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: '韓元' }

const cleanNumber = (value: string) => value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
const numberFormat = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 })

function App() {
  const [from, setFrom] = useState<Currency>(TWD)
  const [to, setTo] = useState<Currency>(KRW)
  const [amount, setAmount] = useState('1000')
  const [rate, setRate] = useState('45.32')
  const [editingRate, setEditingRate] = useState(false)

  const converted = useMemo(() => {
    const input = Number(amount) || 0
    const exchangeRate = Number(rate) || 0
    return from.code === 'TWD' ? input * exchangeRate : input / exchangeRate
  }, [amount, from.code, rate])

  const swap = () => {
    setFrom(to)
    setTo(from)
    setAmount(converted ? String(Number(converted.toFixed(2))) : '')
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow"><Plane size={13} strokeWidth={2.4} /> Seoul trip</p>
            <h1>TravelCalc</h1>
          </div>
          <button className="icon-button" aria-label="更多選項"><MoreHorizontal size={22} /></button>
        </header>

        <section className="hero-copy">
          <p>早安，旅人</p>
          <h2>今天想換算<br /><span>多少旅費？</span></h2>
        </section>

        <section className="converter-card" aria-label="貨幣換算器">
          <div className="currency-row">
            <div className="currency-label">
              <span className="flag">{from.flag}</span>
              <div><small>支付</small><strong>{from.name}</strong></div>
            </div>
            <div className="amount-field">
              <span>{from.symbol}</span>
              <input aria-label={`${from.name}金額`} inputMode="decimal" value={amount} onChange={(event) => setAmount(cleanNumber(event.target.value))} />
            </div>
          </div>

          <div className="divider"><button onClick={swap} aria-label="交換貨幣"><ArrowDownUp size={18} /></button></div>

          <div className="currency-row result-row">
            <div className="currency-label">
              <span className="flag">{to.flag}</span>
              <div><small>可換得</small><strong>{to.name}</strong></div>
            </div>
            <div className="amount-field result"><span>{to.symbol}</span><output>{numberFormat.format(converted)}</output></div>
          </div>

          <div className="rate-bar">
            <div><Sparkles size={14} /><span>1 TWD =</span>
              {editingRate ? (
                <input autoFocus aria-label="自訂匯率" inputMode="decimal" value={rate} onChange={(e) => setRate(cleanNumber(e.target.value))} onBlur={() => setEditingRate(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingRate(false)} />
              ) : <strong>{rate} KRW</strong>}
            </div>
            <button onClick={() => setEditingRate(true)}><Settings2 size={14} /> 自訂</button>
          </div>
        </section>

        <section className="quick-actions">
          <button><span className="action-icon coral"><Plus size={22} /></span><strong>記一筆</strong><small>新增旅費</small></button>
          <button><span className="action-icon blue"><WalletCards size={21} /></span><strong>卡片試算</strong><small>回饋・手續費</small></button>
          <button><span className="action-icon violet"><History size={21} /></span><strong>換算紀錄</strong><small>最近使用</small></button>
        </section>

        <section className="trip-card">
          <div className="trip-icon">🇰🇷</div>
          <div><small>這趟旅行</small><strong>首爾 · Day 3</strong></div>
          <div className="trip-total"><small>今日花費</small><strong>NT$ 2,840</strong></div>
          <ChevronRight size={18} />
        </section>

        <nav className="bottom-nav" aria-label="主要導覽">
          <button className="active"><span>⌁</span>換算</button>
          <button><span>◎</span>旅程</button>
          <button><span>◇</span>錢包</button>
        </nav>
      </section>
    </main>
  )
}

export default App
