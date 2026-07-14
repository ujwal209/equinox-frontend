import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutGrid, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Layers, ChevronDown, Search, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCurrency } from '../context/CurrencyContext'

export const Route = createFileRoute('/dashboard/heatmap')({
  component: DashboardHeatmap,
})

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

function DashboardHeatmap() {
  const [sectors, setSectors] = useState<HeatmapSector[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'perf-high' | 'perf-low' | 'name'>('perf-high')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [sectorSearch, setSectorSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const fetchHeatmapMetadata = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/heatmap`)
      if (res.ok) {
        const json = await res.json()
        setSectors(json)
        if (json.length > 0) setSelectedSector(json[0].sector)
      }
    } catch (err) {
      console.error('Failed to load market heatmap metadata:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatmapMetadata()
  }, [])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-24 text-left">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Lazy Hydrating Performance Map</span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" /> Market Heatmap
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Analyze sectoral growth trends and real-time performance blocks.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting controller selector */}
          <div className="flex bg-muted/10 p-1 rounded-xl border border-border">
            <button
              onClick={() => setSortOrder('perf-high')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer",
                sortOrder === 'perf-high' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              Gainers First
            </button>
            <button
              onClick={() => setSortOrder('perf-low')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer",
                sortOrder === 'perf-low' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              Losers First
            </button>
            <button
              onClick={() => setSortOrder('name')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer",
                sortOrder === 'name' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              Alphabetical
            </button>
          </div>

          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="rounded-xl border-border bg-muted/10 hover:bg-muted/20 font-bold text-white h-9 px-4 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Searchable Sector Dropdown */}
      {!loading && sectors.length > 0 && (
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
              {/* Backdrop to close */}
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
                          selectedSector === sec.sector
                            ? "bg-white text-black"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                        )}
                      >
                        <span>{sec.sector}</span>
                        {selectedSector === sec.sector && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  {sectors.filter((s) => s.sector.toLowerCase().includes(sectorSearch.toLowerCase())).length === 0 && (
                    <div className="text-[10px] text-center text-muted-foreground py-4 font-bold uppercase tracking-wider">
                      No sectors found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 grid-cols-1">
          <Card className="border-border bg-muted/5 p-8 rounded-[2.5rem] space-y-6 animate-pulse">
            <div className="h-6 w-48 bg-zinc-800 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                <div key={i} className="h-28 bg-zinc-850 rounded-3xl" />
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          {sectors.filter(s => s.sector === selectedSector).map((sec) => (
            <SectorCard 
              key={`${sec.sector}-${refreshKey}`}
              sectorData={sec} 
              sortOrder={sortOrder} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SectorCard({ sectorData, sortOrder }: { sectorData: HeatmapSector; sortOrder: string }) {
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true)
      setQuotes({}) // Clear old quotes to show skeleton loader when sector changes
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
        console.error('Failed to load quotes for sector:', sectorData.sector, err)
      } finally {
        setLoading(false)
      }
    }
    loadQuotes()
  }, [sectorData])

  const getSortedCompanies = () => {
    const arr = sectorData.companies.map(c => {
      const q = quotes[c.symbol]
      return {
        ...c,
        price: q ? q.price : 0.0,
        changePercent: q ? q.changePercent : 0.0,
        isLoaded: !loading // Set isLoaded to true when loading is false, preventing stuck skeletons
      }
    })

    if (sortOrder === 'perf-high') {
      return arr.sort((a, b) => b.changePercent - a.changePercent)
    } else if (sortOrder === 'perf-low') {
      return arr.sort((a, b) => a.changePercent - b.changePercent)
    } else {
      return arr.sort((a, b) => a.symbol.localeCompare(b.symbol))
    }
  }

  const sortedCompanies = getSortedCompanies()

  return (
    <Card className="border-border bg-muted/10 rounded-[2.5rem] p-8 text-left flex flex-col gap-6">
      {/* Sector Header Label */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <Layers className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-extrabold text-white text-lg tracking-tight">{sectorData.sector}</h3>
        {loading && <Loader2 className="h-5 w-5 text-zinc-500 animate-spin ml-2" />}
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 ml-auto">
          {sectorData.companies.length} Tickers
        </span>
      </div>

      {/* Grid of Company Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {sortedCompanies.map((c) => {
          const logoUrl = getCompanyLogo(c.name, c.symbol)
          
          if (loading || !c.isLoaded) {
            return (
              <div 
                key={c.symbol} 
                className="rounded-3xl p-5 h-28 bg-zinc-900/40 border border-border/30 flex flex-col justify-between animate-pulse"
              >
                <div className="h-5 w-14 bg-zinc-800 rounded" />
                <div className="h-4 w-20 bg-zinc-800 rounded self-end mt-4" />
              </div>
            )
          }

          const val = c.changePercent
          
          // TradingView style color mapping
          const blockColorClass = 
            val >= 3.0 ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/90" :
            val > 0.0 ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/50" :
            val === 0.0 ? "bg-zinc-900/30 border-border text-zinc-400 hover:bg-zinc-800/40" :
            val > -3.0 ? "bg-rose-950/40 border-rose-700/40 text-rose-400 hover:bg-rose-900/50" :
            "bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900/90"

          return (
            <div
              key={c.symbol}
              onClick={() => navigate({ to: '/dashboard/stock/$symbol', params: { symbol: c.symbol }})}
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
                  <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs font-black text-white shrink-0 uppercase">
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
