import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { cn } from '@/lib/utils'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Briefcase, 
  TrendingUp, 
  Loader2, 
  Plus, 
  TrendingDown, 
  Compass,
  Mail,
  ChevronRight,
  MessageSquare
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

interface LiveIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  history?: number[]
}

const Sparkline = ({ history, changePercent }: { history: number[], changePercent: number }) => {
  if (!history || history.length < 2) return null
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min === 0 ? 1 : max - min
  
  const width = 120
  const height = 36
  const points = history.map((val, index) => {
    const x = (index / (history.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const strokeColor = changePercent >= 0 ? '#10b981' : '#ef4444'
  
  return (
    <svg className="w-28 h-9" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

function DashboardOverview() {
  const { token, user, logout } = useAuth()
  const { convert } = useCurrency()
  const navigate = useNavigate()

  const [portfolio, setPortfolio] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [indices, setIndices] = useState<LiveIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        if (token) {
          const portRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/paper/portfolio`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (portRes.ok) {
            const portData = await portRes.json()
            setPortfolio(portData.portfolio)
            setPositions(portData.positions || [])
          } else if (portRes.status === 401) {
            logout()
          }
        }

        const indicesRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/live`)
        if (indicesRes.ok) {
          const liveData = await indicesRes.json()
          const matchedIndices = liveData.filter((a: any) => a.symbol.startsWith('^')).slice(0, 3)
          setIndices(matchedIndices)
        }
      } catch (err) {
        console.error('Overview initialization error', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  const netPnl = portfolio?.total_pnl ?? 0.0
  const netPnlPercent = portfolio?.total_pnl_percent ?? 0.0
  const totalEquity = portfolio?.total_equity ?? (portfolio?.available_margin ?? 1000000)
  const activePositionsCount = positions.length

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-28 text-left">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              {todayStr} • Market Session
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Overview
          </h1>
          <p className="text-base text-muted-foreground font-semibold mt-1">
            Real-time paper trading performance and benchmark market intelligence.
          </p>
        </div>

        {/* Professional Quick Launcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/dashboard/paper-trading">
            <Button className="rounded-2xl bg-primary text-primary-foreground font-black px-5 h-11 text-xs cursor-pointer shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" /> Place Paper Trade
            </Button>
          </Link>
          <Link to="/dashboard/ai">
            <Button variant="outline" className="rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold px-4 h-11 text-xs cursor-pointer flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-foreground" /> AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
          <Loader2 className="h-8 w-8 text-foreground animate-spin" />
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loading Portfolio Metrics...</p>
        </div>
      ) : (
        <>
          {/* 2. Professional 3-KPI Pillar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* KPI 1: Net Equity */}
            <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Equity
                </span>
                <div className="w-10 h-10 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-foreground">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {convert(totalEquity).formatted}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-1">
                  Virtual Portfolio Capital
                </p>
              </div>
            </Card>

            {/* KPI 2: Net P&L */}
            <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Unrealized P&L
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-2xl border flex items-center justify-center",
                  netPnl >= 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                )}>
                  {netPnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
              </div>
              <div>
                <p className={cn("text-3xl font-black tracking-tight", netPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {netPnl >= 0 ? '+' : ''}{convert(netPnl).formatted}
                </p>
                <p className={cn("text-xs font-extrabold flex items-center gap-1 mt-1", netPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {netPnl >= 0 ? '+' : ''}{netPnlPercent.toFixed(2)}% net performance
                </p>
              </div>
            </Card>

            {/* KPI 3: Active Positions */}
            <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Active Positions
                </span>
                <div className="w-10 h-10 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-foreground">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tight">
                    {activePositionsCount}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    Equities Open
                  </p>
                </div>
                <Link to="/dashboard/paper-trading" className="text-xs font-black text-foreground hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>

          </div>

          {/* 3. Benchmark Market Indices Sparkline Tracker */}
          {indices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-foreground" /> Market Indices
                </span>
                <Link to="/dashboard/heatmap" className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Heatmap Overview <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
                {indices.map((ind) => {
                  const isPositive = ind.changePercent >= 0
                  return (
                    <Card 
                      key={ind.symbol}
                      className="border-border bg-card rounded-[2.2rem] p-6 flex items-center justify-between shadow-md hover:border-border/80 transition-all"
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{ind.symbol}</span>
                        <h4 className="font-black text-foreground text-base tracking-tight mt-0.5">{ind.name.replace('Index', '').trim()}</h4>
                        <p className="text-lg font-black text-foreground mt-2">{convert(ind.price).formatted}</p>
                      </div>

                      {ind.history && (
                        <div className="mx-2 shrink-0">
                          <Sparkline history={ind.history} changePercent={ind.changePercent} />
                        </div>
                      )}

                      <div className="text-right">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-sm",
                          isPositive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        )}>
                          {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {isPositive ? '+' : ''}{ind.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. Active Portfolio Holdings Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-foreground" /> Portfolio Holdings ({positions.length})
              </span>
              <Link to="/dashboard/paper-trading" className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Full Order Terminal <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {positions.length === 0 ? (
              <Card className="border-border bg-card rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center shadow-lg space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
                  <Briefcase className="h-8 w-8 opacity-60" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">No Open Positions</h3>
                  <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto mt-1">
                    Your paper trading portfolio is currently inactive. Explore equities to place your first trade.
                  </p>
                </div>
                <Link to="/dashboard/search">
                  <Button className="rounded-2xl font-black bg-primary text-primary-foreground hover:opacity-90 h-11 px-8 text-xs cursor-pointer shadow-md">
                    Explore Screener
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="rounded-[2.5rem] border border-border bg-card shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px]">Symbol</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Quantity</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Avg Entry Price</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Current Price</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Total Invested</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Current Value</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Day P&L</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {positions.map((pos) => {
                        const safeLtp = typeof pos.ltp === 'number' && Number.isFinite(pos.ltp) ? pos.ltp : (pos.avg_price || 0)
                        const safePnl = typeof pos.pnl === 'number' && Number.isFinite(pos.pnl) ? pos.pnl : 0
                        const safePnlPct = typeof pos.pnl_percent === 'number' && Number.isFinite(pos.pnl_percent) ? pos.pnl_percent : 0
                        const safeInvested = typeof pos.invested === 'number' && Number.isFinite(pos.invested) ? pos.invested : 0
                        const safeValue = typeof pos.current_value === 'number' && Number.isFinite(pos.current_value) ? pos.current_value : safeInvested

                        return (
                          <tr 
                            key={pos.symbol}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: pos.symbol }})}
                          >
                            <td className="px-6 py-5 whitespace-nowrap font-black text-foreground">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={`https://eodhd.com/img/logos/${pos.symbol.toUpperCase().endsWith('.BO') ? 'BSE' : (pos.symbol.includes('.') ? 'NSE' : 'US')}/${pos.symbol.split('.')[0].toUpperCase()}.png`}
                                  alt=""
                                  className="h-9 w-9 rounded-xl bg-white border border-border object-contain p-1 shrink-0 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const fallback = (e.target as HTMLElement).nextElementSibling;
                                    if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                                  }}
                                />
                                <div className="h-9 w-9 rounded-xl bg-muted/60 border border-border hidden items-center justify-center text-xs font-black uppercase text-foreground shrink-0 shadow-sm">
                                  {pos.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <span className="font-black text-foreground text-sm block">{pos.symbol}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Intraday Position</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right font-bold text-foreground">
                              {pos.quantity}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right font-bold text-muted-foreground">
                              {convert(pos.avg_price || 0).formatted}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right font-black text-foreground">
                              {convert(safeLtp).formatted}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right font-bold text-muted-foreground">
                              {convert(safeInvested).formatted}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right font-black text-foreground">
                              {convert(safeValue).formatted}
                            </td>
                            <td className={cn(
                              "px-6 py-5 whitespace-nowrap text-right font-black",
                              safePnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              <div className="flex items-center justify-end gap-1">
                                {safePnl >= 0 ? '+' : ''}{safePnlPct.toFixed(2)}%
                              </div>
                              <span className="text-[10px] font-bold block mt-0.5">
                                {safePnl >= 0 ? '+' : ''}{convert(safePnl).formatted}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                              <Link 
                                to="/dashboard/paper-trading"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 rounded-xl border-border hover:bg-muted font-bold text-xs cursor-pointer"
                                >
                                  Trade
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* 5. Clean Professional Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <Link to="/dashboard/search" className="group">
              <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4 h-full">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-foreground text-base group-hover:underline flex items-center justify-between">
                    Stock Screener <ChevronRight className="h-4 w-4" />
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Screen equities by market cap, sector, valuation, and momentum metrics.
                  </p>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/email-alerts" className="group">
              <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4 h-full">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-foreground text-base group-hover:underline flex items-center justify-between">
                    AI Email Alerts <ChevronRight className="h-4 w-4" />
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Configure automated market news digests and trading signals sent to your inbox.
                  </p>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/ai" className="group">
              <Card className="rounded-[2.2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all flex flex-col justify-between space-y-4 h-full">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-foreground text-base group-hover:underline flex items-center justify-between">
                    Equinox AI <ChevronRight className="h-4 w-4" />
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Chat with your personal financial analyst powered by advanced AI models.
                  </p>
                </div>
              </Card>
            </Link>
          </div>

        </>
      )}
    </div>
  )
}
