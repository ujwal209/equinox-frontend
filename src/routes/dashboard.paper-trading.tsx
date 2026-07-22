import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, 
  History, Briefcase, Plus, TrendingUp, Search, X, Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/paper-trading')({
  component: PaperTrading,
})

const getCompanyLogo = (name: string, symbol: string) => {
  if (!symbol) return null
  const clean = symbol.split('.')[0].toUpperCase()
  const exchange = symbol.toUpperCase().endsWith('.BO') ? 'BSE' : (symbol.includes('.') ? 'NSE' : 'US')
  return `https://eodhd.com/img/logos/${exchange}/${clean}.png`
}

function PaperTrading() {
  const { token, logout } = useAuth()
  const { convert } = useCurrency()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'portfolio' | 'statements'>('portfolio')
  
  // Data states
  const [portfolio, setPortfolio] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [statements, setStatements] = useState<any[]>([])
  
  // Statements Pagination & Filtering States
  const [statementsPage, setStatementsPage] = useState(1)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({})

  // Unique months found in statements (sorted newest first)
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    statements.forEach(stmt => {
      if (stmt.timestamp) {
        try {
          const date = new Date(stmt.timestamp + (stmt.timestamp.endsWith('Z') ? '' : 'Z'))
          const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' })
          months.add(monthLabel)
        } catch (e) {}
      }
    })
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [statements])

  // Filter statements by selected month
  const filteredStatements = useMemo(() => {
    if (selectedMonth === 'all') return statements
    return statements.filter(stmt => {
      if (!stmt.timestamp) return false
      try {
        const date = new Date(stmt.timestamp + (stmt.timestamp.endsWith('Z') ? '' : 'Z'))
        const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' })
        return monthLabel === selectedMonth
      } catch (e) {
        return false
      }
    })
  }, [statements, selectedMonth])

  // Monthly breakdown of profit/loss stats for overview
  const monthlyBreakdown = useMemo(() => {
    const breakdown: Record<string, { pnl: number; count: number; wins: number }> = {}
    statements.forEach(stmt => {
      if (stmt.order_type === 'SELL' && stmt.realized_pnl !== undefined && stmt.realized_pnl !== null) {
        try {
          const date = new Date(stmt.timestamp + (stmt.timestamp.endsWith('Z') ? '' : 'Z'))
          const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' })
          if (!breakdown[monthLabel]) {
            breakdown[monthLabel] = { pnl: 0, count: 0, wins: 0 }
          }
          breakdown[monthLabel].pnl += stmt.realized_pnl
          breakdown[monthLabel].count++
          if (stmt.realized_pnl > 0) {
            breakdown[monthLabel].wins++
          }
        } catch (e) {}
      }
    })
    return Object.entries(breakdown).map(([month, data]) => ({
      month,
      pnl: data.pnl,
      count: data.count,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0
    })).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
  }, [statements])

  // Calculate current filtered period statistics
  const periodStats = useMemo(() => {
    let totalPnl = 0
    let exitTradesCount = 0
    let winningTrades = 0
    
    filteredStatements.forEach(stmt => {
      if (stmt.order_type === 'SELL' && stmt.realized_pnl !== undefined && stmt.realized_pnl !== null) {
        totalPnl += stmt.realized_pnl
        exitTradesCount++
        if (stmt.realized_pnl > 0) {
          winningTrades++
        }
      }
    })

    const winRate = exitTradesCount > 0 ? (winningTrades / exitTradesCount) * 100 : 0
    const avgProfit = exitTradesCount > 0 ? totalPnl / exitTradesCount : 0

    return {
      totalPnl,
      exitTradesCount,
      winRate,
      avgProfit
    }
  }, [filteredStatements])

  const STATEMENTS_ITEMS_PER_PAGE = 10

  const paginatedStatements = useMemo(() => {
    const startIndex = (statementsPage - 1) * STATEMENTS_ITEMS_PER_PAGE
    return filteredStatements.slice(startIndex, startIndex + STATEMENTS_ITEMS_PER_PAGE)
  }, [filteredStatements, statementsPage])

  const totalStatementsPages = Math.ceil(filteredStatements.length / STATEMENTS_ITEMS_PER_PAGE)

  const [isLoading, setIsLoading] = useState(true)
  
  // Order states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderSymbol, setOrderSymbol] = useState('')
  const [orderQty, setOrderQty] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  
  // Search Autocomplete
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Track previous prices to show visual price flashes on real-time update
  const prevPricesRef = useRef<Record<string, number>>({})

  const fetchPortfolio = async (background = false) => {
    if (!token) return
    if (!background) setIsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/paper/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data.portfolio)
        setPositions(data.positions)
        
        // Save current prices to ref to calculate updates
        if (data.positions) {
          data.positions.forEach((pos: any) => {
            prevPricesRef.current[pos.symbol] = pos.ltp
          });
        }
      } else if (res.status === 401) {
        logout()
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!background) setIsLoading(false)
    }
  }

  const fetchStatements = async () => {
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/paper/statements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStatements(data.statements)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTab === 'portfolio') {
      fetchPortfolio()
      interval = setInterval(() => {
        fetchPortfolio(true)
      }, 10000)
    } else {
      fetchStatements()
    }
    return () => clearInterval(interval)
  }, [activeTab, token])
  
  // Autocomplete Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const delay = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        })
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.slice(0, 5))
        }
      } catch (err) {
        // ignore
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const handleExitPosition = (pos: any) => {
    setOrderType(pos.quantity < 0 ? 'BUY' : 'SELL')
    setOrderSymbol(pos.symbol)
    setOrderQty(Math.abs(pos.quantity).toString())
    setSearchQuery('')
    setIsOrderModalOpen(true)
  }

  const submitOrder = async () => {
    setOrderError('')
    if (!orderSymbol || !orderQty || parseInt(orderQty) <= 0) {
      setOrderError('Please enter a valid symbol and quantity.')
      return
    }
    
    setIsSubmittingOrder(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/paper/order`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: orderSymbol.toUpperCase(),
          quantity: parseInt(orderQty),
          order_type: orderType,
          stop_loss: stopLoss ? parseFloat(stopLoss) : null
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        setOrderError(data.detail || 'Order failed')
        toast.error(data.detail || 'Order failed')
      } else {
        toast.success(`${orderType} order for ${orderSymbol} executed successfully!`)
        setIsOrderModalOpen(false)
        setOrderSymbol('')
        setSearchQuery('')
        setOrderQty('')
        setStopLoss('')
        fetchPortfolio(false)
      }
    } catch (err) {
      setOrderError('Network error placing order.')
      toast.error('Network error placing order.')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-24 text-left">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Virtual Intraday Trading Arena</span>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Paper Trading
            <Badge variant="outline" className="ml-2 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              9:15 AM - 3:30 PM IST
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Intraday execution sandbox operating strictly during Indian Stock Market hours (9:15 AM - 3:30 PM IST).
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={activeTab === 'portfolio' ? () => fetchPortfolio(false) : fetchStatements}
            className="rounded-xl border-border bg-muted/10 hover:bg-muted/20 font-bold text-foreground h-9 px-4 cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Refresh
          </Button>
          
          <Dialog open={isOrderModalOpen} onOpenChange={(open) => {
            setIsOrderModalOpen(open);
            if (!open) {
              setOrderSymbol('');
              setSearchQuery('');
              setOrderQty('');
              setStopLoss('');
              setOrderError('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-white hover:bg-zinc-200 text-black font-black px-5 h-9 cursor-pointer shadow-sm text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> Place Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border rounded-[2rem] p-0 overflow-hidden w-[90vw] sm:max-w-xl shadow-2xl text-left">
              {/* Kite Style Header */}
              <div className={cn(
                "px-6 py-4 flex justify-between items-center text-foreground font-black text-base tracking-tight",
                orderType === 'BUY' ? "bg-emerald-650" : "bg-rose-600"
              )}>
                <div className="flex items-center gap-2">
                  <span>{orderType} {orderSymbol || 'ORDER'}</span>
                  <Badge variant="outline" className="text-[8px] font-black border-white/20 text-foreground uppercase bg-white/10 scale-90">NSE</Badge>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Buy / Sell Toggle inside form */}
                <div className="flex bg-muted/10 p-1 rounded-xl border border-border">
                  <button 
                    type="button"
                    onClick={() => setOrderType('BUY')}
                    className={cn("flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer", 
                      orderType === 'BUY' ? "bg-emerald-650 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    BUY
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderType('SELL')}
                    className={cn("flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer", 
                      orderType === 'SELL' ? "bg-rose-650 text-foreground shadow-sm" : "text-muted-foreground hover:text-rose-500"
                    )}
                  >
                    SELL
                  </button>
                </div>
                
                {/* Autocomplete Ticker Search */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Stock</label>
                  
                  {!orderSymbol ? (
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stock symbol (e.g. RELIANCE)..." 
                        className="pl-10 h-12 bg-muted/10 border-border text-foreground font-bold rounded-xl focus-visible:ring-white/5 focus-visible:border-zinc-500 text-sm"
                      />
                      {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                      
                      {/* Search dropdown menu */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-50 top-[calc(100%+8px)] left-0 right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden divide-y divide-border/60">
                          {searchResults.map(res => {
                            const logoUrl = getCompanyLogo(res.name, res.symbol)
                            return (
                              <div 
                                key={res.symbol}
                                onClick={() => {
                                  setOrderSymbol(res.symbol)
                                  setSearchQuery('')
                                  setSearchResults([])
                                }}
                                className="flex items-center gap-3 p-3.5 hover:bg-muted/10 cursor-pointer transition-colors"
                              >
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="" 
                                    className="w-7 h-7 rounded-lg bg-white object-contain p-0.5 border border-black/10 shrink-0 shadow-sm" 
                                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[9px] font-black text-foreground shrink-0 uppercase">
                                    {res.symbol.slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-extrabold text-foreground text-xs tracking-tight">{res.symbol}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[180px] mt-0.5">{res.name}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border rounded-xl">
                      <div className="flex items-center gap-3">
                        {getCompanyLogo(orderSymbol, orderSymbol) ? (
                          <img 
                            src={getCompanyLogo(orderSymbol, orderSymbol) || ''} 
                            alt="" 
                            className="w-8 h-8 rounded-lg bg-white object-contain p-0.5 border border-black/10 shadow-sm" 
                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-foreground uppercase">
                            {orderSymbol.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-black text-sm text-foreground">{orderSymbol}</span>
                      </div>
                      <button type="button" onClick={() => setOrderSymbol('')} className="p-1.5 hover:bg-muted/20 rounded-full text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Inputs for Qty & SL */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity</label>
                    <Input 
                      type="number"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      placeholder="0" 
                      className="h-12 bg-muted/10 border-border text-foreground font-bold rounded-xl focus-visible:ring-white/5 focus-visible:border-zinc-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stop Loss</label>
                    <Input 
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="0.00" 
                      className="h-12 bg-muted/10 border-border text-foreground font-bold rounded-xl focus-visible:ring-white/5 focus-visible:border-zinc-500 text-sm"
                    />
                  </div>
                </div>
                
                {orderError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
                    <p className="text-[11px] font-bold text-rose-500">{orderError}</p>
                  </div>
                )}
                

                
                {/* Big Executing Button */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setIsOrderModalOpen(false)} className="rounded-xl font-bold text-xs h-9 cursor-pointer">
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitOrder}
                    disabled={isSubmittingOrder || !orderSymbol}
                    className={cn("rounded-xl font-black text-xs h-9 px-6 cursor-pointer text-foreground border-none", 
                      orderType === 'BUY' ? "bg-emerald-650 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    {isSubmittingOrder ? <RefreshCw className="h-4 w-4 animate-spin" /> : `${orderType} ${orderSymbol}`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 bg-muted/30 p-1 rounded-xl border border-border w-fit">
        <button 
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'portfolio' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Briefcase className="h-3.5 w-3.5" /> Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('statements')}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'statements' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="h-3.5 w-3.5" /> Statements
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Total Net P&L Hero Card */}
          {portfolio && (
            <Card className="rounded-[2rem] border border-border bg-muted/10 p-8 shadow-sm text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Net Realized & Unrealized P&L</span>
                <div className={cn(
                  "text-4xl font-black tracking-tight",
                  portfolio.total_pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {portfolio.total_pnl >= 0 ? '+' : ''}{convert(portfolio.total_pnl).formatted}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 bg-muted/20 border border-border/30 rounded-2xl p-4 shrink-0 w-full md:w-auto min-w-[240px] text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="flex justify-between items-center gap-4">
                  <span>Unrealized Gain:</span>
                  <span className={cn("font-black", portfolio.total_unrealized_pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {portfolio.total_unrealized_pnl >= 0 ? '+' : ''}{convert(portfolio.total_unrealized_pnl).formatted}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 pt-1.5 border-t border-border/30">
                  <span>Realized P&L:</span>
                  <span className={cn("font-black", portfolio.realized_pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {portfolio.realized_pnl >= 0 ? '+' : ''}{convert(portfolio.realized_pnl).formatted}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Positions Table / Mobile Card Layout */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
              <Briefcase className="h-4 w-4" /> Active Positions
            </span>

            {positions.length === 0 ? (
              <Card className="rounded-[2.2rem] border border-border bg-muted/5 p-10 flex flex-col items-center justify-center text-center shadow-inner">
                <Briefcase className="h-10 w-10 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-base font-bold text-foreground mb-1">No Active Positions</h3>
                <p className="text-xs text-muted-foreground max-w-sm font-semibold mb-6">
                  You haven't purchased any virtual equities yet. Place a buy order to begin.
                </p>
              </Card>
            ) : (
              <>
                {/* Desktop view (lg screens) */}
                <div className="hidden lg:block rounded-[2.2rem] border border-border bg-muted/10 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px]">Symbol</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Qty</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Avg Price</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">LTP (Last Price)</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Total Invested</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">P&L</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {positions.map((pos) => {
                        const logoUrl = getCompanyLogo(pos.symbol, pos.symbol)
                        const safeLtp = typeof pos.ltp === 'number' && Number.isFinite(pos.ltp) ? pos.ltp : (pos.avg_price || 0)
                        const safePnl = typeof pos.pnl === 'number' && Number.isFinite(pos.pnl) ? pos.pnl : 0
                        const safePnlPct = typeof pos.pnl_percent === 'number' && Number.isFinite(pos.pnl_percent) ? pos.pnl_percent : 0
                        const safeInvested = typeof pos.invested === 'number' && Number.isFinite(pos.invested) ? pos.invested : 0
                        
                        const prevLtp = prevPricesRef.current[pos.symbol] ?? safeLtp
                        const priceDir = safeLtp > prevLtp ? 'UP' : safeLtp < prevLtp ? 'DOWN' : 'STABLE'
                        
                        return (
                          <tr key={pos.symbol} className="hover:bg-muted/20 transition-colors duration-300">
                            <td className="px-8 py-5 font-black text-foreground flex items-center gap-3">
                              {logoUrl ? (
                                <img 
                                  src={logoUrl} 
                                  alt="" 
                                  className="w-8 h-8 rounded-xl bg-white object-contain p-0.5 border border-black/10 shrink-0 shadow-sm" 
                                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-foreground shrink-0 uppercase">
                                  {pos.symbol.slice(0, 2)}
                                </div>
                              )}
                              {pos.symbol}
                            </td>
                            <td className="px-8 py-5 font-bold text-foreground text-right">{pos.quantity}</td>
                            <td className="px-8 py-5 font-bold text-muted-foreground text-right">{convert(pos.avg_price || 0).formatted}</td>
                            
                            {/* Live Price with smooth transitions */}
                            <td className="px-8 py-5 text-right font-black">
                              <span className={cn(
                                "transition-all duration-700 px-2 py-1 rounded-md",
                                priceDir === 'UP' ? 'bg-emerald-500/10 text-emerald-500' :
                                priceDir === 'DOWN' ? 'bg-rose-500/10 text-rose-500' : 'text-foreground'
                              )}>
                                {convert(safeLtp).formatted}
                              </span>
                            </td>

                            <td className="px-8 py-5 font-bold text-muted-foreground text-right">{convert(safeInvested).formatted}</td>
                            
                            <td className={cn(
                              "px-8 py-5 font-black text-right",
                              safePnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              <div className="flex items-center justify-end gap-1">
                                {safePnl >= 0 ? '+' : ''}{safePnlPct.toFixed(2)}%
                              </div>
                              <span className="text-[10px] font-bold block mt-0.5">
                                {safePnl >= 0 ? '+' : ''}{convert(safePnl).formatted}
                              </span>
                            </td>
                            
                            <td className="px-8 py-5 text-right">
                              <Button 
                                onClick={() => handleExitPosition(pos)}
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-lg border-rose-500/30 hover:border-rose-500 text-rose-500 hover:bg-rose-500/10 font-black text-xs cursor-pointer"
                              >
                                Exit Position
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view (grid cards below lg screens) */}
                <div className="block lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
                  {positions.map((pos) => {
                    const logoUrl = getCompanyLogo(pos.symbol, pos.symbol)
                    const prevLtp = prevPricesRef.current[pos.symbol] ?? pos.ltp
                    const priceDir = pos.ltp > prevLtp ? 'UP' : pos.ltp < prevLtp ? 'DOWN' : 'STABLE'

                    return (
                      <Card 
                        key={pos.symbol} 
                        className="border-border bg-muted/10 rounded-[2rem] p-5 flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {logoUrl ? (
                              <img 
                                src={logoUrl} 
                                alt="" 
                                className="w-9 h-9 rounded-xl bg-white object-contain p-0.5 border border-black/10 shrink-0" 
                                onError={(e) => (e.currentTarget.style.display = 'none')} 
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-foreground uppercase shrink-0">
                                {pos.symbol.slice(0, 2)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <h4 className="font-extrabold text-foreground text-sm tracking-tight truncate">{pos.symbol}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground truncate">{pos.quantity} Shares</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={cn(
                              "text-xs font-black transition-all duration-700 px-2 py-0.5 rounded-md",
                              priceDir === 'UP' ? 'bg-emerald-500/10 text-emerald-500' :
                              priceDir === 'DOWN' ? 'bg-rose-500/10 text-rose-500' : 'text-foreground'
                            )}>
                              {convert(pos.ltp).formatted}
                            </span>
                            <span className="text-[9px] block text-muted-foreground font-bold uppercase mt-1">LTP</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <div>
                            Avg Price: <span className="text-foreground block font-black text-xs mt-0.5">{convert(pos.avg_price).formatted}</span>
                          </div>
                          <div className="text-right">
                            Invested: <span className="text-foreground block font-black text-xs mt-0.5">{convert(pos.invested).formatted}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-border/40 pt-3 mt-auto">
                          <div className={cn("text-xs font-black text-left", pos.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {pos.pnl >= 0 ? '+' : ''}{convert(pos.pnl).formatted}
                            <span className="text-[10px] font-bold ml-1">({pos.pnl_percent}%)</span>
                          </div>
                          
                          <Button 
                            onClick={() => handleExitPosition(pos)}
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-lg border-rose-500/30 hover:border-rose-500 text-rose-500 hover:bg-rose-500/10 font-black text-xs cursor-pointer"
                          >
                            Exit Position
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'statements' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Month-Wise Breakdown overview */}
          {monthlyBreakdown.length > 0 && (
            <div className="bg-muted/10 border border-border rounded-[2.2rem] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Month-Wise Performance Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthlyBreakdown.map((mb) => (
                  <div key={mb.month} className="p-4 rounded-2xl bg-muted/20 border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">{mb.month}</span>
                      <span className="text-[11px] font-bold text-zinc-405">{mb.count} exit trades ({mb.winRate.toFixed(0)}% win)</span>
                    </div>
                    <span className={cn("text-sm font-black tabular-nums", mb.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {mb.pnl >= 0 ? '+' : ''}₹{mb.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Period statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-muted/10 border-border rounded-[1.8rem]">
              <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Total P&L ({selectedMonth === 'all' ? 'All Time' : selectedMonth})</span>
              <span className={cn("text-lg font-black tabular-nums", periodStats.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {periodStats.totalPnl >= 0 ? '+' : ''}₹{periodStats.totalPnl.toFixed(2)}
              </span>
            </Card>
            <Card className="p-5 bg-muted/10 border-border rounded-[1.8rem]">
              <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Exit Trades</span>
              <span className="text-lg font-black text-foreground tabular-nums">
                {periodStats.exitTradesCount}
              </span>
            </Card>
            <Card className="p-5 bg-muted/10 border-border rounded-[1.8rem]">
              <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Win Rate</span>
              <span className="text-lg font-black text-foreground tabular-nums">
                {periodStats.winRate.toFixed(1)}%
              </span>
            </Card>
            <Card className="p-5 bg-muted/10 border-border rounded-[1.8rem]">
              <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Avg Profit / Trade</span>
              <span className={cn("text-lg font-black tabular-nums", periodStats.avgProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                ₹{periodStats.avgProfit.toFixed(2)}
              </span>
            </Card>
          </div>

          {/* Controls: Month filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Log</h3>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Filter Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  setStatementsPage(1)
                }}
                className="bg-muted/40 border border-border rounded-xl text-xs font-semibold px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="all">All Months</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual records table */}
          <div className="w-full overflow-x-auto rounded-[2.2rem] border border-border bg-muted/10 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px]">Time</th>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px]">Symbol</th>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px]">Type</th>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Qty</th>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Execution Price</th>
                  <th className="px-8 py-5 font-black uppercase tracking-wider text-muted-foreground text-[10px] text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedStatements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground font-bold">
                      No order history found.
                    </td>
                  </tr>
                ) : (
                  paginatedStatements.map((stmt) => {
                    const logoUrl = getCompanyLogo(stmt.symbol, stmt.symbol)
                    return (
                      <tr key={stmt.order_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-8 py-5 font-bold text-muted-foreground whitespace-nowrap text-xs">
                          {new Intl.DateTimeFormat('en-IN', { 
                            day: '2-digit', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit', hour12: true 
                          }).format(new Date(stmt.timestamp + (stmt.timestamp.endsWith('Z') ? '' : 'Z')))}
                        </td>
                        <td className="px-8 py-5 font-black text-foreground flex items-center gap-3">
                          {logoUrl && !brokenLogos[stmt.symbol] ? (
                            <img 
                              src={logoUrl} 
                              alt="" 
                              className="w-7 h-7 rounded-lg bg-white object-contain p-0.5 border border-black/10 shrink-0 shadow-sm" 
                              onError={() => setBrokenLogos(prev => ({ ...prev, [stmt.symbol]: true }))} 
                            />
                          ) : null}
                          {stmt.symbol}
                        </td>
                        <td className="px-8 py-5">
                          <Badge className={cn("text-[9px] font-black border-none uppercase px-2.5 py-0.5 rounded-md", 
                            stmt.order_type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          )}>
                            {stmt.order_type}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 font-bold text-foreground text-right">{stmt.quantity}</td>
                        <td className="px-8 py-5 font-bold text-muted-foreground text-right">{convert(stmt.price).formatted}</td>
                        <td className="px-8 py-5 font-black text-right">
                          {stmt.order_type === 'SELL' ? (
                            stmt.realized_pnl !== undefined && stmt.realized_pnl !== null ? (
                              <span className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-black border-none uppercase", stmt.realized_pnl >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                {stmt.realized_pnl >= 0 ? '+' : ''}{convert(stmt.realized_pnl).formatted}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px] font-bold">Standard Exit</span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-[10px] font-bold">N/A</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalStatementsPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {filteredStatements.length} Records total
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStatementsPage(prev => Math.max(1, prev - 1))}
                  disabled={statementsPage === 1}
                  className="p-2 rounded bg-muted/40 border border-border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  ◀
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalStatementsPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStatementsPage(i + 1)}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-black transition-all border cursor-pointer",
                        statementsPage === i + 1
                          ? "bg-white text-black border-white"
                          : "bg-muted/40 border-border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStatementsPage(prev => Math.min(totalStatementsPages, prev + 1))}
                  disabled={statementsPage === totalStatementsPages}
                  className="p-2 rounded bg-muted/40 border border-border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

        </div>
      )}
      
    </div>
  )
}
