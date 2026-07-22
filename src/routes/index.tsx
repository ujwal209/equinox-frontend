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
  Zap,
  Briefcase,
  Mail,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  BarChart3
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

  // Screener & live state
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (heroDropdownRef.current && !heroDropdownRef.current.contains(event.target as Node)) {
        setShowHeroDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Hero Search Debounce
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

  // Screener Debounce
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

  // Fetch Live Assets
  useEffect(() => {
    async function fetchLiveTrends() {
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
    fetchLiveTrends()
  }, [])

  // Fetch Heatmap Metadata
  useEffect(() => {
    async function fetchHeatmapData() {
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
    fetchHeatmapData()
  }, [])

  return (
    <main className="min-h-screen bg-background flex flex-col pt-6 sm:pt-10 pb-28 px-4 sm:px-6 md:px-8 relative overflow-x-hidden text-left">
      
      {/* Background Lighting Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-zinc-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[45%] -right-40 w-[600px] h-[600px] bg-zinc-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col items-center relative z-10 space-y-16 sm:space-y-24">
        
        {/* 1. Hero Split Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-4 sm:pt-8">
          
          {/* Hero Left Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Equinox Financial Engine
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05]">
              Precision Stock Analytics & Execution.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground font-semibold leading-relaxed max-w-2xl">
              Screen Indian (NSE/BSE) and US equities, analyze sector momentum with heatmaps, track live market indices, and execute paper trades with zero risk.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                <Button className="rounded-2xl bg-primary text-primary-foreground font-black px-7 h-12 text-sm cursor-pointer shadow-xl hover:opacity-90 transition-all flex items-center gap-2">
                  {isAuthenticated ? "Launch Dashboard" : "Get Started Free"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/search">
                <Button variant="outline" className="rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold px-6 h-12 text-sm cursor-pointer flex items-center gap-2">
                  <Compass className="h-4 w-4" /> Stock Screener
                </Button>
              </Link>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/60 max-w-lg">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block">5,000+</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Equities Screened</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block">9:15-3:30</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">IST Market Hours</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground block">100%</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Free Access</span>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Interactive Search Terminal Box */}
          <div className="lg:col-span-5 w-full">
            <Card className="rounded-[2.5rem] border border-border bg-card/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-left" ref={heroDropdownRef}>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground font-black text-xs">
                    EQ
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Stock Screener</h3>
                    <p className="text-[10px] font-bold text-muted-foreground">Instant Ticker Search</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase px-2.5 py-0.5 border-border bg-muted/40">
                  Live
                </Badge>
              </div>

              {/* Terminal Search Input */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
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
                  placeholder="Search TCS, Reliance, Apple..."
                  className="w-full pl-11 pr-10 py-5 h-12 rounded-xl border-border bg-muted/30 text-foreground text-sm font-bold placeholder:text-muted-foreground focus-visible:border-zinc-500 outline-none transition-all shadow-inner"
                />
                {heroLoading && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 text-foreground animate-spin" />
                  </span>
                )}
              </div>

              {/* Search Dropdown Results */}
              {showHeroDropdown && heroQuery.trim().length > 0 && (
                <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-[260px] overflow-y-auto divide-y divide-border">
                  {heroLoading && heroResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs font-bold flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Querying exchange...
                    </div>
                  ) : heroResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs font-bold">
                      No matching stocks found for "{heroQuery}"
                    </div>
                  ) : (
                    heroResults.map((r, i) => {
                      const logoUrl = getCompanyLogo(r.name, r.symbol)
                      return (
                        <Link
                          key={`${r.symbol}-${i}`}
                          to="/dashboard/stock/$symbol"
                          params={{ symbol: r.symbol }}
                          className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors group no-underline text-left"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={logoUrl} 
                              alt="" 
                              className="h-7 w-7 rounded-lg bg-white object-contain p-0.5 border border-border shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                            />
                            <div>
                              <span className="font-black text-foreground text-xs block">{r.symbol}</span>
                              <span className="text-[10px] font-bold text-muted-foreground block truncate max-w-[160px]">{r.name}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase bg-muted/40 border-border">
                            {r.exchDisp}
                          </Badge>
                        </Link>
                      )
                    })
                  )}
                </div>
              )}

              {/* Quick Preset Symbol Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Popular Indian Equities</span>
                <div className="flex flex-wrap gap-2">
                  {['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS'].map((sym) => (
                    <Link 
                      key={sym} 
                      to="/dashboard/stock/$symbol" 
                      params={{ symbol: sym }}
                      className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-xs font-black text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      {sym.replace('.NS', '')}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* 2. Embedded Financial Terminal Suite */}
        <div className="w-full bg-card border border-border rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-8">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Market Intelligence Terminal</h2>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Explore equities, heatmaps, and global indices in real time.</p>
            </div>

            {/* Terminal Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('screener')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'screener' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Compass className="h-4 w-4" /> Screener
              </button>
              <button
                onClick={() => setActiveTab('heatmap')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'heatmap' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <LayoutGrid className="h-4 w-4" /> Sector Heatmap
              </button>
              <button
                onClick={() => setActiveTab('indices')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === 'indices' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Globe className="h-4 w-4" /> Global Indices
              </button>
            </div>
          </div>

          {/* Tab Render Content */}
          <div>
            
            {/* SCREENER TAB */}
            {activeTab === 'screener' && (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                
                {/* Live Market Assets Grid */}
                {liveLoading ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Card key={n} className="border border-border bg-muted/20 p-5 rounded-2xl h-20 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {liveAssets.filter(item => !item.symbol.startsWith('^')).slice(0, 6).map((item) => {
                      const isPositive = item.changePercent >= 0
                      const logoUrl = getCompanyLogo(item.name, item.symbol)
                      return (
                        <Card 
                          key={item.symbol} 
                          className="border border-border bg-muted/20 hover:border-zinc-500/50 hover:bg-muted/40 transition-all rounded-2xl p-5 flex items-center justify-between cursor-pointer group shadow-sm"
                          onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: item.symbol }})}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <img 
                              src={logoUrl} 
                              alt="" 
                              className="h-9 w-9 rounded-xl bg-white object-contain p-1 shrink-0 border border-border shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                            />
                            <div className="overflow-hidden">
                              <h4 className="font-black text-foreground text-sm tracking-tight truncate">{item.symbol}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground truncate">{item.name}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
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
            )}

            {/* HEATMAP TAB */}
            {activeTab === 'heatmap' && (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {heatmapLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 text-foreground animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Sector Heatmap...</p>
                  </div>
                ) : (
                  <>
                    {/* Sector Selector */}
                    {sectors.length > 0 && (
                      <div className="relative z-30 max-w-sm">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="flex items-center justify-between w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground cursor-pointer hover:bg-muted transition-all shadow-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            {selectedSector || "Select Sector..."}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
                        </button>

                        {dropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-2xl p-2 z-30 animate-in fade-in duration-150">
                              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                {sectors.map((sec) => (
                                  <button
                                    key={sec.sector}
                                    onClick={() => {
                                      setSelectedSector(sec.sector)
                                      setDropdownOpen(false)
                                    }}
                                    className={cn(
                                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer",
                                      selectedSector === sec.sector ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

                    {/* Sector Grid Display */}
                    {sectors.filter(s => s.sector === selectedSector).map((sec) => (
                      <SectorCardContainer 
                        key={sec.sector}
                        sectorData={sec} 
                        convert={convert}
                        navigate={navigate}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* GLOBAL INDICES TAB */}
            {activeTab === 'indices' && (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {liveLoading ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                      <Card key={n} className="border border-border bg-muted/20 p-5 rounded-2xl h-20 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {liveAssets.filter(item => item.symbol.startsWith('^')).map((item) => {
                      const isPositive = item.changePercent >= 0
                      return (
                        <Card 
                          key={item.symbol} 
                          className="border border-border bg-muted/20 hover:border-zinc-500/50 hover:bg-muted/40 transition-all rounded-2xl p-5 flex items-center justify-between cursor-pointer group shadow-sm"
                          onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: item.symbol }})}
                        >
                          <div>
                            <span className="font-black text-foreground text-sm tracking-tight">{item.symbol}</span>
                            <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5 max-w-[150px]">{item.name}</p>
                          </div>
                          {item.history && (
                            <div className="mx-2 shrink-0">
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
            )}

          </div>
        </div>

        {/* 3. Core Features Grid */}
        <div className="w-full space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Built for Serious Traders</h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Comprehensive suite of market tools engineered for clarity and performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-base">AI Email Alerts</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1 leading-relaxed">
                  Receive automated intraday news digests and catalysts sent directly to your inbox.
                </p>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-base">Paper Trading</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1 leading-relaxed">
                  Execute virtual intraday trades with real-time Indian stock market feeds (9:15 AM - 3:30 PM IST).
                </p>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-base">Market Sentiment</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1 leading-relaxed">
                  Track bullish and bearish sentiment scores generated by deep news scraping engines.
                </p>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-md hover:border-zinc-500/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-base">Equinox AI</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1 leading-relaxed">
                  Chat with an AI financial assistant trained on technical chart patterns and equity fundamentals.
                </p>
              </div>
            </Card>
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-foreground uppercase tracking-wider">{sectorData.sector} Sector Matrix</h3>
      {loading ? (
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Querying sector quotes...
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sectorData.companies.map((c) => {
            const q = quotes[c.symbol] || {}
            const price = q.price || c.price || 0
            const changePercent = q.changePercent ?? c.changePercent ?? 0
            const isPositive = changePercent >= 0
            const logoUrl = getCompanyLogo(c.name, c.symbol)

            return (
              <Card 
                key={c.symbol}
                className="border border-border bg-muted/20 hover:border-zinc-500/50 hover:bg-muted/40 transition-all rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-sm"
                onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: c.symbol }})}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <img 
                    src={logoUrl} 
                    alt="" 
                    className="h-8 w-8 rounded-lg bg-white object-contain p-0.5 border border-border shrink-0 shadow-sm"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                  />
                  <div className="overflow-hidden">
                    <span className="font-black text-foreground text-xs block truncate">{c.symbol}</span>
                    <span className="text-[10px] font-bold text-muted-foreground block truncate">{c.name}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="font-black text-foreground text-xs block">{convert(price).formatted}</span>
                  <span className={cn(
                    "text-[10px] font-bold inline-flex items-center gap-0.5 mt-0.5",
                    isPositive ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
