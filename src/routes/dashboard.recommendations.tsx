import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/recommendations')({
  component: RecommendationsPage,
})

interface Source {
  source: string
  headline: string
  url?: string
}

interface StockRecommendation {
  symbol: string
  name: string
  logo: string
  price: number
  change: number
  changePercent: number
  sentimentScore: number
  action: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL'
  targetPrice: number
  stopLoss: number
  sources: Source[]
  hasRealNews?: boolean
}

const ITEMS_PER_PAGE = 10

function RecommendationsPage() {
  const { token } = useAuth()
  
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshSentiment = async () => {
    setIsRefreshing(true)
    await fetchRecommendations(true)
    setIsRefreshing(false)
  }

  // Fetch Watchlist-based Recommendations (Paginated)
  const fetchRecommendations = async (forceRefresh = false) => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/recommendations?page=${currentPage}&limit=${ITEMS_PER_PAGE}${forceRefresh ? '&refresh=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRecommendations(json.recommendations || [])
        setTotalItems(json.total || 0)
        if (forceRefresh) {
          toast.success("AI Sentiment scores and targets recalculated successfully.")
        }
      } else {
        if (forceRefresh) {
          toast.error("Failed to recalculate sentiment scores.")
        }
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
      if (forceRefresh) {
        toast.error("An error occurred while recalculating sentiment.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [token, currentPage])

  // Filter recommendations locally based on search input (name/ticker)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return recommendations
    return recommendations.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [recommendations, searchQuery])

  // Pagination Calculations
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  if (loading && currentPage === 1) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
            Scanning Market News & Sentiment...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 relative pb-12 bg-black min-h-screen text-white">
      
      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-zinc-400">
            QUANT ENGINE
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-emerald-500">
            ONLINE
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Watchlist Recommendations</h1>
        <p className="text-sm text-zinc-400 font-semibold max-w-2xl">
          AI sentiment scanner and target analysis compiled dynamically for watchlist symbols. Click any row to expand news sources.
        </p>
      </div>

      {recommendations.length === 0 && searchQuery === '' ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-black uppercase tracking-wider text-white">Watchlists Empty</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-semibold">
              Add assets to your watchlist to activate live news sentiment scans.
            </p>
          </div>
          <Link
            to="/dashboard/watchlist"
            className="px-6 py-3.5 rounded bg-zinc-900 border border-zinc-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors no-underline cursor-pointer inline-block"
          >
            Configure Watchlist
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Search bar & Email dispatcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-3 rounded border border-zinc-800 bg-zinc-950 text-sm font-semibold text-white placeholder:text-zinc-650 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            <button
              onClick={handleRefreshSentiment}
              disabled={isRefreshing || recommendations.length === 0}
              className="px-5 py-3 rounded bg-zinc-900 border border-zinc-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
            >
              {isRefreshing ? 'Recalculating...' : 'Refresh Sentiment'}
            </button>
          </div>

          {/* Responsive Flow List */}
          <div className="space-y-4">
            {filteredData.map((stock, idx) => {
              const isExpanded = expandedSymbol === stock.symbol
              const isBuy = stock.action.includes('BUY')
              
              // Accent mapping
              const actionColor = isBuy ? 'text-emerald-400' : (stock.action.includes('SELL') ? 'text-rose-400' : 'text-amber-400')
              const actionBg = isBuy ? 'bg-emerald-950/20 border-emerald-900/30' : (stock.action.includes('SELL') ? 'bg-rose-950/20 border-rose-900/30' : 'bg-amber-950/20 border-amber-900/30')
              const priceColor = stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'

              return (
                <Card 
                  key={stock.symbol}
                  onClick={() => setExpandedSymbol(isExpanded ? null : stock.symbol)}
                  className={cn(
                    "border-zinc-850 bg-zinc-950 p-5 hover:border-zinc-750 transition-all duration-200 cursor-pointer select-none rounded-2xl relative overflow-hidden",
                    isExpanded && "border-zinc-700 bg-zinc-900/35"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Left details: Rank + Logo + Symbol & Company */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm font-black text-zinc-550 w-6 shrink-0 text-center">
                        #{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </span>
                      {stock.logo && !brokenLogos[stock.symbol] && (
                        <img
                          src={stock.logo}
                          alt=""
                          className="w-8 h-8 rounded bg-white p-0.5 object-contain border border-zinc-800 shrink-0"
                          onError={() => {
                            setBrokenLogos(prev => ({ ...prev, [stock.symbol]: true }))
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-base font-black uppercase tracking-tight">{stock.symbol}</span>
                          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block sm:hidden">
                            {stock.action}
                          </span>
                        </div>
                        <h4 className="text-xs text-zinc-400 truncate max-w-[240px] font-semibold leading-relaxed" title={stock.name}>
                          {stock.name}
                        </h4>
                      </div>
                    </div>

                    {/* Middle details: Targets + Sentiment Score */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-start gap-4 sm:gap-8 text-xs font-semibold text-zinc-400">
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-550 block mb-0.5">Price & Change</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn("font-black text-sm tabular-nums", priceColor)}>₹{stock.price.toFixed(2)}</span>
                          <span className={cn("text-[10px] font-bold tabular-nums", priceColor)}>
                            ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-550 block mb-0.5">Technical Targets</span>
                        <div className="text-zinc-300">
                          Tgt: <span className="text-white font-bold">₹{stock.targetPrice.toFixed(0)}</span> | SL: <span className="text-white font-bold">₹{stock.stopLoss.toFixed(0)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-550 block mb-0.5">AI Sentiment</span>
                        <div>
                          Rating: <span className={cn("font-black", actionColor)}>{stock.sentimentScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Right details: Action Badge & Expand Chevron symbol */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-zinc-900 pt-3 sm:pt-0 sm:border-0">
                      <span className="text-zinc-550 text-[10px] font-bold tracking-widest block sm:hidden uppercase">Signal Action</span>
                      <div className="flex items-center gap-4">
                        <Badge className={cn(
                          "px-3 py-1.5 text-[10px] font-black tracking-widest border rounded uppercase shrink-0 shadow-md",
                          actionBg, actionColor
                        )}>
                          {stock.action}
                        </Badge>
                        <span className="text-zinc-500 text-xs font-bold shrink-0 hidden sm:inline">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-zinc-800/80 space-y-5 text-sm animate-in slide-in-from-top-1 duration-200">
                      
                      {/* Consensus Paragraph */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest block">Consensus Analysis</span>
                        <p className="text-zinc-300 leading-relaxed max-w-4xl font-medium">
                          {stock.hasRealNews ? 
                            `AI compiled sentiment analysis scans reveal active headlines showing a ${stock.action} pattern with a quantitative rating score of ${stock.sentimentScore} out of 100.` :
                            `No direct coverage detected today. Neutral baseline momentum evaluation indicates minor session change of ${stock.changePercent.toFixed(2)}%.`
                          }
                        </p>
                      </div>

                      {/* Detailed News Sources (Clean list rows) */}
                      {stock.sources && stock.sources.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-zinc-900">
                          <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest block">Verified Sentiment Sources</span>
                          <div className="space-y-4">
                            {stock.sources.map((src, i) => {
                              const getSourceDomain = (source: string) => {
                                const s = source.toLowerCase();
                                if (s.includes('cnbc')) return 'cnbc.com';
                                if (s.includes('reuters')) return 'reuters.com';
                                if (s.includes('bloomberg')) return 'bloomberg.com';
                                if (s.includes('moneycontrol')) return 'moneycontrol.com';
                                if (s.includes('livemint') || s.includes('mint')) return 'livemint.com';
                                if (s.includes('economic times') || s.includes('indiatimes')) return 'economictimes.indiatimes.com';
                                if (s.includes('business standard')) return 'business-standard.com';
                                if (s.includes('wsj') || s.includes('wall street')) return 'wsj.com';
                                if (s.includes('yahoo')) return 'finance.yahoo.com';
                                return 'google.com';
                              }

                              return (
                                <div key={i} className="flex items-start gap-4 py-1 text-left">
                                  <img
                                    src={`https://www.google.com/s2/favicons?sz=64&domain=${getSourceDomain(src.source)}`}
                                    alt=""
                                    className="w-5 h-5 rounded shrink-0 object-contain bg-white p-0.5 border border-zinc-800 mt-0.5"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="space-y-1 leading-snug">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{src.source}</span>
                                      {src.url && (
                                        <a 
                                          href={src.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-[10px] text-zinc-500 hover:text-white underline cursor-pointer"
                                        >
                                          [Open Article]
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-zinc-450 text-sm font-semibold leading-relaxed">{src.headline}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Clean Text Link to terminal */}
                      <div className="pt-2">
                        <Link
                          to="/dashboard/stock/$symbol"
                          params={{ symbol: stock.symbol }}
                          className="inline-block py-2.5 px-5 rounded bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest no-underline cursor-pointer"
                        >
                          Open Asset Terminal
                        </Link>
                      </div>

                    </div>
                  )}

                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">
                {totalItems} STOCKS TOTAL
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  ◀
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-9 h-9 rounded text-xs font-black transition-all border cursor-pointer",
                        currentPage === i + 1
                          ? "bg-zinc-800 border-zinc-700 text-white"
                          : "bg-zinc-900 border-zinc-850 text-zinc-450 hover:text-zinc-200 hover:bg-zinc-800"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
