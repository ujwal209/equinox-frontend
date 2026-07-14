import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  PlusCircle, 
  TrendingDown, 
  Layers
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

const getCompanyLogo = (name: string, symbol: string) => {
  const n = name.toLowerCase()
  const s = symbol.toUpperCase().split('.')[0]
  const client_id = "1idlu8B6H0L485PeI84"
  
  const map: Record<string, string> = {
    'RELIANCE': 'ril.com',
    'TCS': 'tcs.com',
    'INFY': 'infosys.com',
    'HDFCBANK': 'hdfcbank.com',
    'ICICIBANK': 'icicibank.com',
    'WIPRO': 'wipro.com',
    'ADANIENT': 'adani.com',
    'ADANIPORTS': 'adani.com',
    'ADANIENSOL': 'adani.com',
    'WOCKPHARMA': 'wockhardt.com',
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'NVDA': 'nvidia.com',
    'GOOGL': 'google.com',
    'GOOG': 'google.com',
    'AMZN': 'amazon.com',
    'TSLA': 'tesla.com',
    'META': 'meta.com',
    'NFLX': 'netflix.com'
  }
  
  const domain = map[s] || (
    n.includes('reliance') ? 'ril.com' :
    n.includes('tata consultancy') || n.includes('tcs') ? 'tcs.com' :
    n.includes('infosys') ? 'infosys.com' :
    n.includes('hdfc') ? 'hdfcbank.com' :
    n.includes('icici') ? 'icicibank.com' :
    n.includes('wipro') ? 'wipro.com' :
    n.includes('adani') ? 'adani.com' :
    n.includes('wockhardt') || n.includes('wockpharma') ? 'wockhardt.com' :
    !symbol.includes('.') ? `${s.toLowerCase()}.com` : null
  )
  
  if (domain) return `https://cdn.brandfetch.io/domain/${domain}?c=${client_id}`
  return null
}

const Sparkline = ({ history, changePercent }: { history: number[], changePercent: number }) => {
  if (!history || history.length < 2) return null
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min === 0 ? 1 : max - min
  
  const width = 100
  const height = 30
  const points = history.map((val, index) => {
    const x = (index / (history.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const strokeColor = changePercent >= 0 ? '#10b981' : '#ef4444'
  
  return (
    <svg className="w-24 h-8" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  )
}

function DashboardOverview() {
  const { token, logout } = useAuth()
  const { convert } = useCurrency()
  const navigate = useNavigate()

  const [portfolio, setPortfolio] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [indices, setIndices] = useState<LiveIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch paper trading portfolio info
        if (token) {
          const portRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/paper/portfolio`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (portRes.ok) {
            const portData = await portRes.json()
            setPortfolio(portData.portfolio)
            setPositions(portData.positions)
          } else if (portRes.status === 401) {
            logout()
          }
        }

        // 2. Fetch market indices
        const indicesRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/live`)
        if (indicesRes.ok) {
          const liveData = await indicesRes.json()
          // Filter to show only index assets (starts with ^ or is index type)
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

  // Compute paper trading performance metrics (Day's P&L)
  const netEarnings = portfolio?.total_pnl ?? 0.0
  const earningsPercent = portfolio?.total_pnl_percent ?? 0.0
  const activePositionsCount = positions.length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-24 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground font-semibold mt-1">Your paper trading holdings and real-time market tracker.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">Gathering your portfolio metrics...</p>
        </div>
      ) : (
        <>
          {/* Single Hero P&L Card */}
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="border-border bg-muted/10 shadow-sm rounded-[2rem] p-8 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Net Paper Trading P&L</span>
                <div className={cn(
                  "text-4xl font-black tracking-tight",
                  netEarnings >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {netEarnings >= 0 ? '+' : ''}{convert(netEarnings).formatted}
                </div>
                <div className={cn(
                  "text-xs font-bold flex items-center gap-1 mt-2",
                  netEarnings >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {netEarnings >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {netEarnings >= 0 ? '+' : ''}{earningsPercent.toFixed(2)}% net performance
                </div>
              </div>
              
              <div className="flex flex-col gap-2 bg-muted/20 border border-border/30 rounded-2xl p-4 shrink-0 w-full md:w-auto min-w-[200px]">
                <div className="text-xs font-bold text-muted-foreground">
                  Active Positions: <span className="text-white font-black ml-1">{activePositionsCount}</span>
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  Available Cash: <span className="text-white font-black ml-1">{convert(portfolio?.cash ?? 1000000).formatted}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Core Market Indices Sparklines */}
          {indices.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
                <Activity className="h-4 w-4" /> Market Indices
              </span>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {indices.map((ind) => {
                  const isPositive = ind.changePercent >= 0
                  return (
                    <Card 
                      key={ind.symbol}
                      className="border-border bg-muted/10 rounded-[2rem] p-5 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <h4 className="font-extrabold text-white text-sm tracking-tight">{ind.name.replace('Index', '').trim()}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{ind.symbol}</p>
                      </div>

                      {ind.history && (
                        <div className="mx-2 shrink-0">
                          <Sparkline history={ind.history} changePercent={ind.changePercent} />
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-black text-white text-sm">{convert(ind.price).formatted}</p>
                        <span className={cn(
                          "text-[10px] font-bold flex items-center gap-0.5 justify-end mt-0.5",
                          isPositive ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {isPositive ? '+' : ''}{ind.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active Positions or CTA */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
              <Briefcase className="h-4 w-4" /> Portfolio Holdings
            </span>
            
            {positions.length === 0 ? (
              <Card className="border-border bg-muted/5 rounded-[2.2rem] p-10 flex flex-col items-center justify-center text-center shadow-inner">
                <Briefcase className="h-10 w-10 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-base font-bold text-white mb-1">No Active Positions</h3>
                <p className="text-xs text-muted-foreground max-w-sm font-semibold mb-6">
                  You haven't purchased any virtual equities yet. Open the search screener to place your first trade.
                </p>
                <Link to="/dashboard/search">
                  <Button className="rounded-xl font-bold bg-white text-black hover:bg-zinc-200 cursor-pointer h-9 px-6 text-xs">
                    Find Stocks
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="rounded-[2.2rem] border border-border bg-muted/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Symbol</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Qty</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Avg Price</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Live Price</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Total Cost</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Current Value</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {positions.map((pos) => {
                        const cost = pos.quantity * pos.avg_price
                        const value = pos.quantity * pos.current_price
                        const pnl = value - cost
                        const pnlPercent = (pnl / cost) * 100
                        const logoUrl = getCompanyLogo(pos.symbol, pos.symbol)
                        
                        return (
                          <tr 
                            key={pos.symbol}
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: pos.symbol }})}
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                              <div className="flex items-center gap-3">
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="" 
                                    className="h-8 w-8 rounded-lg bg-white object-contain p-0.5 shrink-0 shadow-sm"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase text-white shrink-0">
                                    {pos.symbol.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                                  </div>
                                )}
                                {pos.symbol}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-muted-foreground">
                              {pos.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-muted-foreground">
                              {convert(pos.avg_price).formatted}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-white">
                              {convert(pos.current_price).formatted}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-muted-foreground">
                              {convert(cost).formatted}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-white">
                              {convert(value).formatted}
                            </td>
                            <td className={cn(
                              "px-6 py-4 whitespace-nowrap text-right font-black",
                              pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              <div className="flex items-center justify-end gap-1">
                                {pnl >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </div>
                              <span className="text-[10px] font-bold block mt-0.5">
                                {pnl >= 0 ? '+' : ''}{convert(pnl).formatted}
                              </span>
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
        </>
      )}
    </div>
  )
}
