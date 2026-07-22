import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building2,
  History,
  Loader2,
  Layers,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const searchSchema = z.object({
  q: z.string().optional().catch(''),
})

export const Route = createFileRoute('/dashboard/search')({
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchPage,
})

interface TickerMatch {
  symbol: string
  name: string
  sector?: string
  exchDisp: string
  typeDisp: string
}

interface LiveAsset {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  history?: number[]
}

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
  
  // Calculate coordinates for path
  const points = history.map((val, index) => {
    const x = (index / (history.length - 1)) * width
    const y = height - padding - ((val - min) / range) * (height - 2 * padding)
    return { x, y }
  })
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  
  const strokeColor = changePercent >= 0 ? '#10b981' : '#ef4444' // Emerald or Rose
  const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg className="w-28 h-10 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Gradient Fill Area */}
      <path d={fillPath} fill={`url(#${gradId})`} />
      {/* Highlight Line */}
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchPage() {
  const { isAuthenticated, user } = useAuth()
  const { convert } = useCurrency()
  const navigate = useNavigate()
  const { q } = Route.useSearch()
  
  const [query, setQuery] = useState(q || '')
  const [results, setResults] = useState<TickerMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(['RELIANCE.NS', 'TCS.NS', 'AAPL', 'NVDA', 'BTC'])
  
  const [liveStocks, setLiveStocks] = useState<LiveAsset[]>([])
  const [liveLoading, setLiveLoading] = useState(true)

  const sectorFilters = [
    { name: 'Technology', label: 'Tech' },
    { name: 'Financial Services', label: 'Finance' },
    { name: 'Energy', label: 'Energy' },
    { name: 'Healthcare', label: 'Pharma' },
    { name: 'Consumer Cyclical', label: 'Retail' },
    { name: 'Industrials', label: 'Industrials' },
    { name: 'Real Estate', label: 'Realty' },
    { name: 'Utilities', label: 'Utilities' }
  ]

  useEffect(() => {
    async function loadLive() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/live`)
        if (res.ok) {
          const data = await res.json()
          const stocks = data.filter((a: any) => !a.symbol.startsWith('^')).slice(0, 6)
          setLiveStocks(stocks)
        }
      } catch (err) {
        console.error('Error fetching live stocks:', err)
      } finally {
        setLiveLoading(false)
      }
    }
    loadLive()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })
        if (!res.ok) throw new Error('Search autocomplete failed')
        const data = await res.json()
        if (data) {
          setResults(data)
        }
      } catch (err) {
        console.error('Screener Search Exception:', err)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query, isAuthenticated, user])

  const handleRecentClick = (symbol: string) => {
    setQuery(symbol)
  }

  const handleAddToRecent = (symbol: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== symbol)
      return [symbol, ...filtered].slice(0, 5)
    })
  }

  const hasResults = results.length > 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-24 text-left">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Equity Engine</span>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Screener
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Build your algorithmic thesis based on live database streams.
          </p>
        </div>
      </div>

      {/* Glow Search Bar Container */}
      <section className="relative w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-[2.2rem] blur opacity-10 group-focus-within:opacity-35 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex items-center bg-muted/10 border border-border rounded-[2rem] p-1.5 focus-within:border-zinc-500 transition-all duration-300 shadow-lg backdrop-blur-2xl">
          <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, ticker or sector..."
            className="flex-1 bg-transparent border-none text-sm font-bold text-foreground px-3 py-3 focus:outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <span className="mr-3">
              <Loader2 className="h-5 w-5 text-foreground animate-spin" />
            </span>
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mr-3 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded bg-muted/20"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Sector Pills horizontal scroller */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
          <Layers className="h-4 w-4" /> Filter Sectors
        </span>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
          {sectorFilters.map((sec) => (
            <button
              key={sec.name}
              onClick={() => setQuery(query === sec.name ? '' : sec.name)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                query === sec.name 
                  ? "bg-white text-black border-white shadow-md hover:bg-zinc-100" 
                  : "bg-muted/10 border-border text-muted-foreground hover:text-foreground hover:border-zinc-600"
              )}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Display workspace */}
      <div className="w-full">
        {/* Render live trends when no query entered */}
        {!query && (
          <section className="space-y-10 animate-in fade-in duration-300">
            {/* Live Market Cards (Google Finance Sparklines) */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
                <ArrowUpRight className="h-4 w-4" /> Live Market Trends
              </span>
              
              {liveLoading ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <Card key={n} className="border-border bg-muted/5 p-6 rounded-[2rem] h-24 flex items-center justify-between animate-pulse">
                      <div className="space-y-2 w-1/3">
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                        <div className="h-3 w-24 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-zinc-800 rounded" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {liveStocks.map((item) => {
                    const isPositive = item.changePercent >= 0
                    const logoUrl = getCompanyLogo(item.name, item.symbol)
                    
                    return (
                      <Card 
                        key={item.symbol} 
                        className="border-border bg-muted/10 hover:border-zinc-650 hover:bg-muted/20 transition-all duration-300 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer group hover:-translate-y-1 hover:shadow-lg text-left"
                        onClick={() => {
                          handleAddToRecent(item.symbol)
                          navigate({ to: '/dashboard/stock/$symbol', params: { symbol: item.symbol }})
                        }}
                      >
                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="" 
                              className="h-12 w-12 rounded-3xl bg-white object-contain p-1 shrink-0 shadow-sm border border-black/10 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const s = item.symbol.toUpperCase().split('.')[0];
                                if (target.src.includes(`/NSE/${s}.png`)) {
                                  target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                                } else if (target.src.includes(`/US/${s}.png`)) {
                                  target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                                } else if (target.src.includes('eodhd.com')) {
                                  const domain = getBrandfetchDomain(item.name, item.symbol);
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
                            <div className="h-12 w-12 rounded-3xl bg-zinc-800 flex items-center justify-center text-sm font-black uppercase text-foreground shrink-0 group-hover:scale-105 transition-transform">
                              {item.symbol.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <h4 className="font-extrabold text-foreground text-sm tracking-tight truncate">{item.symbol}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">{item.name}</p>
                          </div>
                        </div>

                        {/* Sparkline Graph */}
                        {item.history && (
                          <div className="mx-3 shrink-0">
                            <Sparkline history={item.history} changePercent={item.changePercent} />
                          </div>
                        )}

                        <div className="text-right shrink-0 pl-1">
                          <p className="font-black text-foreground text-sm">{convert(item.price).formatted}</p>
                          <span className={cn(
                            "text-[10px] font-bold flex items-center gap-0.5 justify-end mt-0.5",
                            isPositive ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Searches */}
            <div className="space-y-3 pt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
                <History className="h-4 w-4" /> Recent Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <Button
                    key={s}
                    variant="secondary"
                    onClick={() => handleRecentClick(s)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition border border-border cursor-pointer bg-muted/10 text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Render searching states */}
        {query && !loading && !hasResults && (
          <div className="text-center py-24 border border-dashed border-border rounded-[2rem] bg-muted/5 animate-in fade-in">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-sm font-bold text-muted-foreground">No equities found matching "{query}".</p>
          </div>
        )}

        {/* Render search results (Spacious Desktop Table, Grid Cards on Mobile) */}
        {hasResults && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 space-y-4">
            
            {/* Desktop Table View (lg screens) */}
            <div className="hidden lg:block rounded-[2.2rem] border border-border bg-muted/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-8 py-5 font-black uppercase tracking-wider text-[10px]">Symbol</th>
                      <th className="px-8 py-5 font-black uppercase tracking-wider text-[10px]">Company Name</th>
                      <th className="px-8 py-5 font-black uppercase tracking-wider text-[10px]">Sector</th>
                      <th className="px-8 py-5 font-black uppercase tracking-wider text-[10px] text-right">Exchange</th>
                      <th className="px-8 py-5 font-black uppercase tracking-wider text-[10px] text-right">Type</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((item) => {
                      const logoUrl = getCompanyLogo(item.name, item.symbol)
                      
                      return (
                        <tr 
                          key={item.symbol} 
                          className="hover:bg-muted/20 transition-colors group cursor-pointer" 
                          onClick={() => { 
                            handleAddToRecent(item.symbol); 
                            navigate({ to: '/dashboard/stock/$symbol', params: { symbol: item.symbol }}) 
                          }}
                        >
                          <td className="px-8 py-5 whitespace-nowrap font-black text-foreground">
                            <div className="flex items-center gap-3.5">
                              {logoUrl ? (
                                <img 
                                  src={logoUrl} 
                                  alt="" 
                                  className="h-10 w-10 rounded-2xl bg-white object-contain p-0.5 shrink-0 shadow-sm border border-black/10 group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const s = item.symbol.toUpperCase().split('.')[0];
                                    if (target.src.includes(`/NSE/${s}.png`)) {
                                      target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                                    } else if (target.src.includes(`/US/${s}.png`)) {
                                      target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                                    } else if (target.src.includes('eodhd.com')) {
                                      const domain = getBrandfetchDomain(item.name, item.symbol);
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
                                <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-foreground shrink-0 group-hover:scale-105 transition-transform">
                                  {item.symbol.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                                </div>
                              )}
                              {item.symbol}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-muted-foreground font-semibold truncate max-w-[220px] md:max-w-[300px]">
                            {item.name}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/30">
                              {item.sector || 'Equity'}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right">
                            <Badge variant="outline" className="font-bold bg-background border-border">{item.exchDisp}</Badge>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right">
                            <Badge variant="secondary" className="font-bold text-[10px]">{item.typeDisp}</Badge>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right text-muted-foreground group-hover:text-foreground transition-colors">
                            <ArrowUpRight className="h-4.5 w-4.5 inline" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Responsive Grid Cards View (below lg screens) */}
            <div className="block lg:hidden space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block pl-2 mb-2">Search Matches</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item) => {
                  const logoUrl = getCompanyLogo(item.name, item.symbol)
                  return (
                    <Card
                      key={item.symbol}
                      className="border-border bg-muted/10 p-5 rounded-[2rem] hover:border-zinc-650 transition-colors flex items-center justify-between cursor-pointer text-left"
                      onClick={() => {
                        handleAddToRecent(item.symbol)
                        navigate({ to: '/dashboard/stock/$symbol', params: { symbol: item.symbol }})
                      }}
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden flex-1 mr-2">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt="" 
                            className="h-12 w-12 rounded-3xl bg-white object-contain p-1 shrink-0 shadow-sm border border-black/10"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const s = item.symbol.toUpperCase().split('.')[0];
                              if (target.src.includes(`/NSE/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                              } else if (target.src.includes(`/US/${s}.png`)) {
                                target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                              } else if (target.src.includes('eodhd.com')) {
                                const domain = getBrandfetchDomain(item.name, item.symbol);
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
                            {item.symbol.replace(/[^A-Za-z]/g, '').slice(0,2) || 'EQ'}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-foreground text-sm tracking-tight truncate flex items-center gap-1.5">
                            {item.symbol}
                            <Badge variant="outline" className="text-[8px] font-black uppercase scale-90 px-1.5 border-border/50">{item.exchDisp}</Badge>
                          </h4>
                          <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">{item.name}</p>
                          <span className="inline-block mt-2 text-[9px] font-bold text-zinc-400 bg-muted/30 border border-border/40 px-2 py-0.5 rounded-md">
                            {item.sector || 'Equity'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted/20 border border-border">
                        <ChevronRight className="h-4 w-4 text-foreground" />
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
