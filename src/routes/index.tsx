import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Globe,
  LayoutGrid,
  ArrowRight,
  Loader2,
  Building2,
  ChevronDown,
  Layers,
  Check,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Zap
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({ component: LandingPage })

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

interface HeatmapCompany {
  symbol: string
  name: string
  price?: number
  changePercent?: number
}

interface HeatmapSector {
  sector: string
  companies: HeatmapCompany[]
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
  const s = symbol.toUpperCase().split('.')[0]
  if (symbol.includes('.')) {
    return `https://eodhd.com/img/logos/NSE/${s}.png`
  }
  return `https://eodhd.com/img/logos/US/${s}.png`
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

function LandingPage() {
  const navigate = useNavigate()
  const { convert } = useCurrency()
  const { isAuthenticated } = useAuth()
  
  // Hero Search state
  const [heroQuery, setHeroQuery] = useState('')
  const [heroResults, setHeroResults] = useState<TickerMatch[]>([])
  const [heroLoading, setHeroLoading] = useState(false)
  const [showHeroDropdown, setShowHeroDropdown] = useState(false)
  const heroDropdownRef = useRef<HTMLDivElement>(null)

  // Active Terminal Tab
  const [activeTab, setActiveTab] = useState<'screener' | 'heatmap' | 'indices'>('screener')

  // Reusable screener and heatmap state
  const [screenerQuery, setScreenerQuery] = useState('')
  const [screenerResults, setScreenerResults] = useState<TickerMatch[]>([])
  const [screenerLoading, setScreenerLoading] = useState(false)
  const [liveAssets, setLiveAssets] = useState<LiveAsset[]>([])
  const [liveLoading, setLiveLoading] = useState(true)

  // Heatmap state
  const [sectors, setSectors] = useState<HeatmapSector[]>([])
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [sectorSearch, setSectorSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [heatmapLoading, setHeatmapLoading] = useState(true)
  const [heatmapRefreshKey, setHeatmapRefreshKey] = useState(0)

  // Handle outside click to close hero dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (heroDropdownRef.current && !heroDropdownRef.current.contains(event.target as Node)) {
        setShowHeroDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Hero Debounced Search
  useEffect(() => {
    if (!heroQuery.trim()) {
      setHeroResults([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      setHeroLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: heroQuery })
        })
        if (res.ok) {
          const data = await res.json()
          setHeroResults(data.slice(0, 6))
          setShowHeroDropdown(true)
        }
      } catch (err) {
        console.error('Hero Search fail:', err)
      } finally {
        setHeroLoading(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [heroQuery])

  // Screener Debounced Search
  useEffect(() => {
    if (!screenerQuery.trim()) {
      setScreenerResults([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      setScreenerLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: screenerQuery })
        })
        if (res.ok) {
          const data = await res.json()
          setScreenerResults(data)
        }
      } catch (err) {
        console.error('Screener Search fail:', err)
      } finally {
        setScreenerLoading(false)
      }
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [screenerQuery])

  // Fetch Live Trends (Screener + Indices Tab)
  const fetchLiveTrends = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/live`)
      if (res.ok) {
        const data = await res.json()
        setLiveAssets(data)
      }
    } catch (err) {
      console.error('Live data fetch failed:', err)
    } finally {
      setLiveLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveTrends()
  }, [])

  // Fetch Heatmap Metadata
  const fetchHeatmapData = async () => {
    setHeatmapLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/heatmap`)
      if (res.ok) {
        const json = await res.json()
        setSectors(json)
        if (json.length > 0 && !selectedSector) setSelectedSector(json[0].sector)
      }
    } catch (err) {
      console.error('Heatmap meta fail:', err)
    } finally {
      setHeatmapLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatmapData()
  }, [heatmapRefreshKey])

  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-zinc-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] bg-zinc-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12 max-w-4xl mx-auto mt-8 flex flex-col items-center">
          <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400">
            Real-Time Market Terminal
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
            Global Markets. <br />Decentralized Intelligence.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto font-semibold mt-2">
            Experience premium financial tools without boundaries. Screen thousands of global equities, analyze sectors via high-performance heatmaps, and track international indices—completely free for guests.
          </p>
        </div>

        {/* Global Terminal Search */}
        <div className="w-full max-w-2xl mx-auto relative mb-20 z-40" ref={heroDropdownRef}>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-white transition-colors" />
            <Input
              type="text"
              value={heroQuery}
              onChange={(e) => {
                setHeroQuery(e.target.value)
                setShowHeroDropdown(true)
              }}
              onFocus={() => {
                if (heroQuery.trim().length > 0) setShowHeroDropdown(true)
              }}
              placeholder="Search companies, ticker symbols, or crypto (e.g. Apple, Reliance)..."
              className="w-full pl-14 pr-12 py-6 h-14 rounded-2xl border-border bg-muted/5 text-white text-base placeholder:text-muted-foreground focus-visible:border-zinc-500 focus-visible:ring-white/5 transition-all shadow-xl backdrop-blur-md"
            />
            {heroLoading && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showHeroDropdown && heroQuery.trim().length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-zinc-950 border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[350px] overflow-y-auto z-50 divide-y divide-border/60">
              {heroLoading && heroResults.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Querying Database...
                </div>
              ) : heroResults.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm font-semibold">
                  No matching assets found for "{heroQuery}"
                </div>
              ) : (
                <div className="flex flex-col p-1.5">
                  {heroResults.map((r, i) => {
                    const logoUrl = getCompanyLogo(r.name, r.symbol)
                    return (
                      <Link
                        key={`${r.symbol}-${i}`}
                        to="/stock/$symbol"
                        params={{ symbol: r.symbol }}
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/10 transition-colors group no-underline text-left"
                      >
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="" 
                              className="h-8 w-8 rounded-lg bg-white object-contain p-0.5 border border-black/10 shrink-0 shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const s = r.symbol.toUpperCase().split('.')[0];
                                if (target.src.includes(`/NSE/${s}.png`)) {
                                  target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                                } else if (target.src.includes(`/US/${s}.png`)) {
                                  target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                                } else if (target.src.includes('eodhd.com')) {
                                  const domain = getBrandfetchDomain(r.name, r.symbol);
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
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase text-white shrink-0">
                              {r.symbol.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'EQ'}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-white text-sm tracking-tight block">{r.symbol}</span>
                            <span className="text-[10px] font-bold text-muted-foreground mt-0.5 block truncate max-w-[240px]">{r.name}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-background px-2.5 py-0.5 border-border/80 h-auto">
                          {r.exchDisp}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Embedded Financial Terminal Panel */}
        <div className="w-full bg-muted/10 border border-border/80 rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-3xl shadow-2xl relative mb-16">
          <div className="absolute top-6 right-8 hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live guest session
          </div>

          {/* Terminal Tabs */}
          <div className="flex items-center border-b border-border/40 pb-4 mb-8 overflow-x-auto no-scrollbar gap-2">
            <button
              onClick={() => setActiveTab('screener')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'screener' ? "bg-white text-black shadow-md" : "text-muted-foreground hover:text-white hover:bg-muted/10"
              )}
            >
              <Compass className="h-4 w-4" /> Screener
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'heatmap' ? "bg-white text-black shadow-md" : "text-muted-foreground hover:text-white hover:bg-muted/10"
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Market Heatmap
            </button>
            <button
              onClick={() => setActiveTab('indices')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'indices' ? "bg-white text-black shadow-md" : "text-muted-foreground hover:text-white hover:bg-muted/10"
              )}
            >
              <Globe className="h-4 w-4" /> Global Indices
            </button>
          </div>

          {/* Tab Render Switchboard */}
          <div>
            
            {/* 1. SCREENER TAB */}
            {activeTab === 'screener' && (
              <div className="space-y-8 animate-in fade-in duration-200 text-left">
                <div className="relative flex items-center bg-muted/10 border border-border/80 rounded-2xl p-1.5 focus-within:border-zinc-500 transition-all max-w-xl shadow-lg">
                  <Search className="h-4.5 w-4.5 text-muted-foreground ml-3 shrink-0" />
                  <input
                    type="text"
                    value={screenerQuery}
                    onChange={(e) => setScreenerQuery(e.target.value)}
                    placeholder="Search database (e.g. Wockhardt, Reliance)..."
                    className="flex-1 bg-transparent border-none text-xs font-bold text-white px-3 py-2.5 focus:outline-none placeholder:text-muted-foreground"
                  />
                  {screenerLoading && <Loader2 className="h-4.5 w-4.5 text-white animate-spin mr-3" />}
                </div>

                {/* Show Live Market Trends when there's no screener search query */}
                {!screenerQuery && (
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
                            <div className="h-8 w-24 bg-zinc-850 rounded" />
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {liveAssets.filter(item => !item.symbol.startsWith('^')).slice(0, 6).map((item) => {
                          const isPositive = item.changePercent >= 0
                          const logoUrl = getCompanyLogo(item.name, item.symbol)
                          return (
                            <Card 
                              key={item.symbol} 
                              className="border-border bg-muted/10 hover:border-zinc-650 hover:bg-muted/20 transition-all duration-300 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer group hover:-translate-y-1 hover:shadow-lg"
                              onClick={() => navigate({ to: '/stock/$symbol', params: { symbol: item.symbol }})}
                            >
                              <div className="flex items-center gap-4 overflow-hidden flex-1">
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
                                  <div className="h-12 w-12 rounded-3xl bg-zinc-800 flex items-center justify-center text-sm font-black uppercase text-white shrink-0">
                                    {item.symbol.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'EQ'}
                                  </div>
                                )}
                                <div className="overflow-hidden">
                                  <h4 className="font-extrabold text-white text-sm tracking-tight truncate">{item.symbol}</h4>
                                  <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">{item.name}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 pl-1">
                                <p className="font-black text-white text-sm">{convert(item.price).formatted}</p>
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
                )}

                {/* Search Results Display */}
                {screenerQuery && (
                  <div className="space-y-4">
                    {screenerResults.length === 0 && !screenerLoading ? (
                      <div className="text-center py-16 border border-dashed border-border rounded-[2rem] bg-muted/5">
                        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-xs font-bold text-muted-foreground">No matches found for "{screenerQuery}".</p>
                      </div>
                    ) : (
                      <div className="rounded-[2rem] border border-border bg-muted/15 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                              <tr>
                                <th className="px-6 py-4 font-black uppercase tracking-wider text-[9px]">Symbol</th>
                                <th className="px-6 py-4 font-black uppercase tracking-wider text-[9px]">Name</th>
                                <th className="px-6 py-4 font-black uppercase tracking-wider text-[9px]">Sector</th>
                                <th className="px-6 py-4 font-black uppercase tracking-wider text-[9px] text-right">Exchange</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {screenerResults.map((item, idx) => {
                                const logoUrl = getCompanyLogo(item.name, item.symbol)
                                return (
                                  <tr 
                                    key={`${item.symbol}-${idx}`} 
                                    className="hover:bg-muted/20 transition-colors group cursor-pointer" 
                                    onClick={() => navigate({ to: '/stock/$symbol', params: { symbol: item.symbol }})}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap font-black text-white">
                                      <div className="flex items-center gap-3">
                                        {logoUrl ? (
                                          <img 
                                            src={logoUrl} 
                                            alt="" 
                                            className="h-10 w-10 rounded-2xl bg-white object-contain p-0.5 shrink-0 shadow-sm border border-black/10"
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
                                          <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-white shrink-0">
                                            {item.symbol.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'EQ'}
                                          </div>
                                        )}
                                        {item.symbol}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground font-semibold truncate max-w-[200px]">{item.name}</td>
                                    <td className="px-6 py-4 font-black uppercase tracking-wider text-[9px] text-muted-foreground">{item.sector || 'Equity'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">{item.exchDisp}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. HEATMAP TAB */}
            {activeTab === 'heatmap' && (
              <div className="space-y-8 animate-in fade-in duration-200 text-left">
                {heatmapLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Loading Heatmap Matrix...</p>
                  </div>
                ) : (
                  <>
                    {/* Searchable Sector Dropdown */}
                    {sectors.length > 0 && (
                      <div className="relative z-50">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="flex items-center justify-between w-full md:w-96 px-5 py-3 bg-zinc-900/60 border border-border/80 rounded-2xl text-sm font-bold text-white cursor-pointer hover:bg-zinc-800/80 transition-all shadow-md"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="h-4.5 w-4.5 text-muted-foreground" />
                            {selectedSector || "Select Sector..."}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
                        </button>

                        {dropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute left-0 mt-2 w-full md:w-96 bg-zinc-950 border border-border rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                              <div className="relative flex items-center mb-3">
                                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <input
                                  type="text"
                                  placeholder="Search sectors..."
                                  value={sectorSearch}
                                  onChange={(e) => setSectorSearch(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-border/60 rounded-xl text-xs font-semibold text-white placeholder-muted-foreground focus:outline-none focus:border-white/40 transition-colors"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                                {sectors
                                  .filter((s) => s.sector.toLowerCase().includes(sectorSearch.toLowerCase()))
                                  .map((sec) => (
                                    <button
                                      key={sec.sector}
                                      onClick={() => {
                                        setSelectedSector(sec.sector)
                                        setDropdownOpen(false)
                                        setSectorSearch('')
                                      }}
                                      className={cn(
                                        "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer",
                                        selectedSector === sec.sector ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                      )}
                                    >
                                      <span>{sec.sector}</span>
                                      {selectedSector === sec.sector && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Sector Card grid display */}
                    {sectors.filter(s => s.sector === selectedSector).map((sec) => (
                      <SectorCardContainer 
                        key={`${sec.sector}-${heatmapRefreshKey}`}
                        sectorData={sec} 
                        convert={convert}
                        navigate={navigate}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* 3. GLOBAL INDICES TAB */}
            {activeTab === 'indices' && (
              <div className="space-y-6 animate-in fade-in duration-200 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pl-1">
                  <Globe className="h-4 w-4" /> Global Indices Watch
                </span>
                {liveLoading ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                      <Card key={n} className="border-border bg-muted/5 p-6 rounded-[2rem] h-24 flex items-center justify-between animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {liveAssets.filter(item => item.symbol.startsWith('^')).map((item) => {
                      const isPositive = item.changePercent >= 0
                      return (
                        <Card 
                          key={item.symbol} 
                          className="border-border bg-muted/10 hover:border-zinc-650 hover:bg-muted/20 transition-all duration-300 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer group hover:-translate-y-1 hover:shadow-lg"
                          onClick={() => navigate({ to: '/stock/$symbol', params: { symbol: item.symbol }})}
                        >
                          <div>
                            <span className="font-extrabold text-white text-sm tracking-tight">{item.symbol}</span>
                            <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5 max-w-[150px]">{item.name}</p>
                          </div>
                          {item.history && (
                            <div className="mx-3 shrink-0">
                              <Sparkline history={item.history} changePercent={item.changePercent} />
                            </div>
                          )}
                          <div className="text-right shrink-0 pl-1">
                            <p className="font-black text-white text-sm">{convert(item.price).formatted}</p>
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
            )}

          </div>
        </div>

        {/* Feature Highlights section */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
          <div className="bg-muted/5 border border-border/60 rounded-[2rem] p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Technical Screeners</h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Filter equities dynamically across global exchanges. Check prices, sector assignments, and listings in a unified matrix.
              </p>
            </div>
            <Link to="/search" className="text-xs font-black text-white uppercase tracking-wider inline-flex items-center gap-1.5 mt-8 hover:translate-x-1.5 transition-transform no-underline">
              Launch Screener <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-muted/5 border border-border/60 rounded-[2rem] p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Live Heatmaps</h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Track daily performance metrics grouped by sector. Beautiful color tags signify strong bullish gainers or bearish outliers.
              </p>
            </div>
            <Link to="/heatmap" className="text-xs font-black text-white uppercase tracking-wider inline-flex items-center gap-1.5 mt-8 hover:translate-x-1.5 transition-transform no-underline">
              Launch Heatmap <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}

function SectorCardContainer({ sectorData, convert, navigate }: { sectorData: HeatmapSector; convert: any; navigate: any }) {
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true)
      setQuotes({})
      try {
        const symbols = sectorData.companies.map(c => c.symbol)
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        })
        if (res.ok) {
          const data = await res.json()
          const quotesMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.symbol]: curr }), {})
          setQuotes(quotesMap)
        }
      } catch (err) {
        console.error('Heatmap quotes fail:', err)
      } finally {
        setLoading(false)
      }
    }
    loadQuotes()
  }, [sectorData])

  const arr = sectorData.companies.map(c => {
    const q = quotes[c.symbol]
    return {
      ...c,
      price: q ? q.price : 0.0,
      changePercent: q ? q.changePercent : 0.0,
      isLoaded: !loading
    }
  })

  return (
    <Card className="border-border bg-muted/10 rounded-[2.5rem] p-8 text-left flex flex-col gap-6 w-full mt-6 shadow-xl">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <Layers className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-extrabold text-white text-lg tracking-tight">{sectorData.sector}</h3>
        {loading && <Loader2 className="h-4.5 w-4.5 text-zinc-500 animate-spin ml-2" />}
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 ml-auto">
          {sectorData.companies.length} Tickers
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {arr.map((c) => {
          const logoUrl = getCompanyLogo(c.name, c.symbol)
          
          if (loading || !c.isLoaded) {
            return (
              <div 
                key={c.symbol} 
                className="rounded-3xl p-5 h-28 bg-zinc-900/40 border border-border/30 flex flex-col justify-between animate-pulse"
              >
                <div className="h-5 w-14 bg-zinc-850 rounded" />
                <div className="h-4 w-20 bg-zinc-850 rounded self-end mt-4" />
              </div>
            )
          }

          const val = c.changePercent
          const blockColorClass = 
            val >= 3.0 ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/90" :
            val > 0.0 ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/50" :
            val === 0.0 ? "bg-zinc-900/30 border-border text-zinc-400 hover:bg-zinc-800/40" :
            val > -3.0 ? "bg-rose-950/40 border-rose-700/40 text-rose-400 hover:bg-rose-900/50" :
            "bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900/90"

          return (
            <div
              key={c.symbol}
              onClick={() => navigate({ to: '/stock/$symbol', params: { symbol: c.symbol }})}
              className={cn(
                "rounded-3xl p-5 flex flex-col justify-between gap-4 cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all duration-300 border text-left",
                blockColorClass
              )}
            >
              <div className="flex items-center justify-between gap-2">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="" 
                    className="h-10 w-10 rounded-2xl bg-white object-contain p-1 border border-black/10 shrink-0 shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const s = c.symbol.toUpperCase().split('.')[0];
                      if (target.src.includes(`/NSE/${s}.png`)) {
                        target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                      } else if (target.src.includes(`/US/${s}.png`)) {
                        target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                      } else if (target.src.includes('eodhd.com')) {
                        const domain = getBrandfetchDomain(c.name, c.symbol);
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
                  <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-white shrink-0 uppercase">
                    {c.symbol.slice(0, 2)}
                  </div>
                )}
                <span className="font-extrabold text-sm tracking-tight uppercase truncate">{c.symbol.split('.')[0]}</span>
              </div>
              
              <div className="text-right mt-1">
                <p className="text-[10px] font-bold opacity-80 uppercase leading-none mb-1">{c.symbol.includes('.') ? 'NSE' : 'NYSE'}</p>
                <span className="text-sm font-black block tracking-tight">
                  {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
