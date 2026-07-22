import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Trash2, Search, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/watchlist')({
  component: DashboardWatchlist,
})
const getBrandfetchDomain = (name: string, symbol: string) => {
  const n = name.toLowerCase()
  const s = symbol.toUpperCase().split('.')[0]
  
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
  
  return map[s] || (
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
}

const getCompanyLogo = (name: string, symbol: string) => {
  if (!symbol) return ''
  const clean = symbol.split('.')[0].toUpperCase()
  const exchange = symbol.toUpperCase().endsWith('.BO') ? 'BSE' : (symbol.includes('.') ? 'NSE' : 'US')
  return `https://eodhd.com/img/logos/${exchange}/${clean}.png`
}
const Sparkline = ({ history, changePercent }: { history: number[], changePercent: number }) => {
  if (!history || history.length < 2) return null
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min === 0 ? 1 : max - min
  
  const width = 120
  const height = 40
  const padding = 2
  
  const points = history.map((val, index) => {
    const x = (index / (history.length - 1)) * width
    const y = height - padding - ((val - min) / range) * (height - 2 * padding)
    return { x, y }
  })
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  
  const strokeColor = changePercent >= 0 ? '#10b981' : '#ef4444'
  const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg className="w-28 h-10 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}



interface Watchlist {
  id: string
  name: string
  symbols: string[]
}

interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  isPositive: boolean
}

function DashboardWatchlist() {
  const { isAuthenticated, token, logout } = useAuth()
  const { convert } = useCurrency()
  const navigate = useNavigate()
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [loadingInitial, setLoadingInitial] = useState(true)

  // 1. Fetch Watchlists
  const fetchWatchlists = async () => {
    if (!token) {
      setLoadingInitial(false)
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWatchlists(data)
        if (data.length > 0 && !activeListId) {
          setActiveListId(data[0].id)
        } else if (data.length === 0) {
          setActiveListId(null)
        }
      } else if (res.status === 401) {
        logout()
      }
    } catch (err) {
      console.error('Failed to load watchlists', err)
    } finally {
      setLoadingInitial(false)
    }
  }

  useEffect(() => {
    fetchWatchlists()
  }, [token])

  // 2. Poll Live Quotes for active watchlist
  useEffect(() => {
    let interval: NodeJS.Timeout
    const fetchQuotes = async () => {
      const activeList = watchlists.find(w => w.id === activeListId)
      if (!activeList || activeList.symbols.length === 0) {
        setQuotes({})
        return
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: activeList.symbols })
        })
        if (res.ok) {
          const data = await res.json()
          const quotesMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.symbol]: curr }), {})
          setQuotes(quotesMap)
        }
      } catch (err) {
        console.error('Failed to fetch quotes', err)
      }
    }

    if (activeListId) {
      fetchQuotes()
      interval = setInterval(fetchQuotes, 15000)
    }
    return () => clearInterval(interval)
  }, [activeListId, watchlists])

  // 3. Search Autocomplete
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
    }, 400)
    return () => clearTimeout(delay)
  }, [searchQuery])

  // Handlers
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newListName })
      })
      if (res.ok) {
        const data = await res.json()
        setWatchlists([...watchlists, data])
        setActiveListId(data.id)
        setNewListName('')
        setIsCreating(false)
      } else if (res.status === 401) {
        logout()
      }
    } catch (err) {}
  }

  const handleDeleteList = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setWatchlists(watchlists.filter(w => w.id !== id))
        if (activeListId === id) setActiveListId(watchlists[0]?.id || null)
        toast.success("Watchlist deleted successfully")
      }
    } catch (err) {
      toast.error("Failed to delete watchlist")
    }
  }

  const handleAddSymbol = async (symbol: string) => {
    if (!activeListId) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist/${activeListId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol })
      })
      if (res.ok) {
        const data = await res.json()
        setWatchlists(watchlists.map(w => w.id === activeListId ? data : w))
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (err) {}
  }

  const handleRemoveSymbol = async (symbol: string) => {
    if (!activeListId) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist/${activeListId}/remove/${symbol}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWatchlists(watchlists.map(w => w.id === activeListId ? data : w))
      }
    } catch (err) {}
  }

  if (loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      </div>
    )
  }

  const activeList = watchlists.find(w => w.id === activeListId)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Watchlists</h1>
          <p className="text-sm text-muted-foreground font-medium">Monitor your custom portfolios and track live prices.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm" className="rounded-xl font-bold gap-1.5 h-9 bg-white hover:bg-zinc-200 text-black">
          <Plus className="h-4 w-4" /> New Watchlist
        </Button>
      </div>



      {/* Tabs */}
      {watchlists.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {watchlists.map(w => (
            <button
              key={w.id}
              onClick={() => setActiveListId(w.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border",
                activeListId === w.id 
                  ? "bg-white text-black border-white shadow-md hover:bg-zinc-150"
                  : "bg-muted/10 text-muted-foreground border-border/30 hover:border-zinc-650 hover:text-foreground"
              )}
            >
              {w.name}
            </button>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="text-center py-16 border border-dashed border-[var(--line)] rounded-3xl bg-muted/10">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-muted-foreground">You have no watchlists yet.</p>
            <Button onClick={() => setIsCreating(true)} variant="link" className="text-foreground font-bold">Create one now</Button>
          </div>
        )
      )}

      {/* Active Watchlist Details */}
      {activeList && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/10 p-4 rounded-[2rem] border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search symbol to add (e.g. Reliance, AAPL)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 bg-muted/15 border-border rounded-xl focus-visible:ring-white/5 focus-visible:border-zinc-500 font-semibold h-11"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-border/60">
                  {searchResults.map((res: any, idx) => (
                    <button
                      key={`${res.symbol}-${idx}`}
                      onClick={() => handleAddSymbol(res.symbol)}
                      className="w-full text-left px-5 py-3.5 hover:bg-muted/20 flex justify-between items-center transition"
                    >
                      <div className="flex items-center gap-3.5">
                        {getCompanyLogo(res.name, res.symbol) ? (
                          <img 
                            src={getCompanyLogo(res.name, res.symbol)} 
                            alt="" 
                            className="h-10 w-10 rounded-xl bg-white object-contain p-0.5 shrink-0 shadow-sm border border-black/10"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const s = res.symbol.toUpperCase().split('.')[0];
                              if (target.src.includes(`/NSE/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                              } else if (target.src.includes(`/US/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                              } else if (target.src.includes('eodhd.com')) {
                                const domain = getBrandfetchDomain(res.name, res.symbol);
                                if (domain) {
                                  target.src = `https://cdn.brandfetch.io/domain/${domain}?c=1idlu8B6H0L485PeI84`;
                                } else {
                                  target.style.display = 'none';
                                }
                              } else {
                                target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-foreground shrink-0">
                            {res.symbol.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-foreground text-sm tracking-tight">{res.symbol}</div>
                          <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[200px] mt-0.5">{res.name}</div>
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-muted/20 border border-border flex items-center justify-center hover:scale-105 transition-transform">
                        <Plus className="h-3.5 w-3.5 text-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={() => handleDeleteList(activeList.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl font-bold w-full sm:w-auto h-11 px-4 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Delete List
            </Button>
          </div>

          <div className="grid gap-4">
            {activeList.symbols.length === 0 ? (
              <div className="text-center py-10 bg-[var(--surface-strong)] border border-[var(--line)] rounded-2xl">
                <p className="text-sm font-semibold text-muted-foreground">No symbols added yet. Search above to add.</p>
              </div>
            ) : (
              activeList.symbols.map(sym => {
                const q = quotes[sym]
                return (
                  <Card 
                    key={sym} 
                    className="border-border bg-muted/10 hover:border-zinc-650 hover:bg-muted/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-[2rem] group cursor-pointer text-left" 
                    onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: sym }})}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 overflow-hidden mr-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(sym); }}
                          className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity shrink-0"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        
                        {/* Logo Integration */}
                        {getCompanyLogo(q ? q.name : '', sym) ? (
                          <img 
                            src={getCompanyLogo(q ? q.name : '', sym)} 
                            alt="" 
                            className="h-12 w-12 rounded-3xl bg-white object-contain p-1 shrink-0 shadow-sm border border-black/10"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const s = sym.toUpperCase().split('.')[0];
                              if (target.src.includes(`/NSE/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                              } else if (target.src.includes(`/US/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                              } else if (target.src.includes('eodhd.com')) {
                                const domain = getBrandfetchDomain(q ? q.name : '', sym);
                                if (domain) {
                                  target.src = `https://cdn.brandfetch.io/domain/${domain}?c=1idlu8B6H0L485PeI84`;
                                } else {
                                  target.style.display = 'none';
                                }
                              } else {
                                target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-3xl bg-zinc-800 flex items-center justify-center text-sm font-black uppercase text-foreground shrink-0">
                            {sym.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                          </div>
                        )}

                        <div className="overflow-hidden">
                          <h3 className="font-extrabold text-foreground text-sm tracking-tight">{sym}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">{q ? q.name : 'Loading...'}</p>
                        </div>
                      </div>

                      {/* Sparkline Graph */}
                      {q && q.history && (
                        <div className="mx-3 shrink-0 hidden sm:block">
                          <Sparkline history={q.history} changePercent={q.changePercent} />
                        </div>
                      )}

                      <div className="text-right shrink-0 pl-1">
                        {q ? (
                          <>
                            <div className="font-black text-foreground text-sm">{convert(q.price).formatted}</div>
                            <span className={cn(
                              "text-[10px] font-bold flex items-center gap-0.5 justify-end mt-0.5",
                              q.isPositive ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {q.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {q.changePercent.toFixed(2)}%
                            </span>
                          </>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}
      {/* Create Watchlist Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="rounded-[2rem] border border-border bg-background max-w-md p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Create Watchlist</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Organize your favorite equities, indices or crypto trackers into a custom surveillance feed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateList} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Watchlist Name</label>
              <Input 
                autoFocus
                placeholder="e.g. Bluechip Equities, Crypto Monitor..." 
                value={newListName} 
                onChange={e => setNewListName(e.target.value)} 
                className="bg-muted/10 border-border rounded-xl focus-visible:ring-white/5 focus-visible:border-zinc-500 font-semibold"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl font-bold text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs h-9 px-4">
                Create Watchlist
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
