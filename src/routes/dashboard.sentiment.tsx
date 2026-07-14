import { createFileRoute } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { Newspaper, Search, Cpu, ExternalLink, Loader2, BarChart2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export const Route = createFileRoute('/dashboard/sentiment')({
  component: DashboardSentiment,
})

interface Article {
  title: string
  url: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  summary: string
  snippet?: string
}

interface SentimentReport {
  summary: string
  score: number
  status: string
  articles: Article[]
}

interface ArticleDetail {
  summary: string
  raw_content: string
}

function DashboardSentiment() {
  const [activeCategory, setActiveCategory] = useState<'market' | 'sectors' | 'companies' | 'custom'>('market')
  const [activeQuery, setActiveQuery] = useState('Indian Stock Market Overall Sentiment')
  const [searchVal, setSearchVal] = useState('')
  const [report, setReport] = useState<SentimentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lazy loading article detail states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [detailData, setDetailData] = useState<ArticleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const marketPresets = [
    { name: 'Nifty 50 Outlook', query: 'Nifty 50 market news outlook' },
    { name: 'Indian Market Sentiment', query: 'Indian Stock Market Overall Sentiment' },
    { name: 'Global Headwinds', query: 'Global stock market headwind indicators' }
  ]

  const sectorPresets = [
    { name: 'IT & Software', query: 'Technology Nifty IT sector stock news' },
    { name: 'Banking & Financials', query: 'Banking sector Nifty Financial Services news' },
    { name: 'Energy & Power', query: 'Energy Nifty Energy sector stock news' },
    { name: 'Healthcare & Pharma', query: 'Healthcare Nifty Pharma sector news' },
    { name: 'Auto & Mobility', query: 'Auto sector Nifty Auto stock news' },
    { name: 'FMCG & Retail', query: 'FMCG Nifty FMCG sector consumer stock news' },
    { name: 'Metal & Mining', query: 'Nifty Metal mining sector stock news' },
    { name: 'Real Estate & Infra', query: 'Nifty Realty real estate infrastructure stock news' },
    { name: 'Telecom', query: 'Telecom sector Nifty stock news' },
    { name: 'Defense & Aerospace', query: 'Defense aerospace manufacturing stock news India' }
  ]

  const companyPresets = [
    { name: 'Reliance Industries', query: 'Reliance Industries stock news sentiment' },
    { name: 'HDFC Bank', query: 'HDFC Bank stock news sentiment' },
    { name: 'Tata Motors', query: 'Tata Motors stock news sentiment' },
    { name: 'TCS', query: 'TCS Tata Consultancy Services stock news' },
    { name: 'Adani Group', query: 'Adani stock news market sentiment' }
  ]

  useEffect(() => {
    fetchSentiment(activeQuery)
  }, [activeQuery])

  useEffect(() => {
    if (selectedArticle) {
      fetchArticleDetail(selectedArticle)
    }
  }, [selectedArticle])

  const fetchSentiment = async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      } else {
        setError('Failed to fetch sentiment report.')
      }
    } catch (e) {
      console.error(e)
      setError('Connection to sentiment server failed.')
    } finally {
      setLoading(false)
    }
  }

  const fetchArticleDetail = async (article: Article) => {
    setDetailLoading(true)
    setDetailError(null)
    setDetailData(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/sentiment/article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url, title: article.title })
      })
      if (res.ok) {
        const data = await res.json()
        setDetailData(data)
      } else {
        setDetailError('Failed to extract article details.')
      }
    } catch (e) {
      console.error(e)
      setDetailError('Unable to connect to deep scrap server.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchVal.trim()) return
    setActiveQuery(searchVal.trim())
    setActiveCategory('custom')
  }

  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-emerald-500'
    if (score > 55) return 'text-green-400'
    if (score > 45) return 'text-zinc-400'
    if (score > 30) return 'text-orange-500'
    return 'text-rose-600'
  }

  const getScoreProgressColor = (score: number) => {
    if (score > 70) return 'bg-emerald-500'
    if (score > 55) return 'bg-green-400'
    if (score > 45) return 'bg-zinc-400'
    if (score > 30) return 'bg-orange-500'
    return 'bg-rose-600'
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-7xl mx-auto pb-24 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <BarChart2 className="h-6 w-6" /> Market Sentiment Intelligence
        </h1>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          Deep news aggregation and real-time LLM market sentiment profiling.
        </p>
      </div>

      {/* Navigation presets and Custom Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border pb-4">
          {/* Preset category tabs */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border">
            {(['market', 'sectors', 'companies'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  if (cat === 'market') setActiveQuery(marketPresets[0].query)
                  if (cat === 'sectors') setActiveQuery(sectorPresets[0].query)
                  if (cat === 'companies') setActiveQuery(companyPresets[0].query)
                }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer",
                  activeCategory === cat ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Custom Search Form */}
          <form onSubmit={handleCustomSearch} className="relative flex items-center w-full md:w-80 bg-muted/30 border border-border rounded-xl p-1 pl-3 shadow-inner">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search custom topic or stock..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs font-bold text-white px-2 py-1.5 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Sub-presets rendering */}
        {activeCategory !== 'custom' && (
          <div className="flex flex-wrap gap-2">
            {(activeCategory === 'market' ? marketPresets : 
              activeCategory === 'sectors' ? sectorPresets : companyPresets).map((p) => (
              <button
                key={p.name}
                onClick={() => setActiveQuery(p.query)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                  activeQuery === p.query 
                    ? "bg-zinc-800 border-zinc-700 text-white" 
                    : "bg-muted/20 border-border text-muted-foreground hover:text-white"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Analysis Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">Analyzing news and generating report...</p>
        </div>
      ) : error ? (
        <div className="text-center py-24 border border-border bg-muted/20 rounded-[2rem]">
          <p className="text-red-500 font-bold">{error}</p>
          <button onClick={() => fetchSentiment(activeQuery)} className="mt-4 text-xs font-bold bg-white text-black px-4 py-2 rounded-xl cursor-pointer">Try Again</button>
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Summary and Score */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[2rem] p-8 border-border bg-muted/10 shadow-lg relative overflow-hidden text-left flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Analysis Target</span>
                <h2 className="text-xl font-black text-white tracking-tight mb-6">
                  {activeQuery.replace(' news sentiment', '').replace(' stock news sentiment', '').replace(' news outlook', '')}
                </h2>
                
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">AI Sentiment Briefing</span>
                <div className="prose prose-sm dark:prose-invert prose-zinc max-w-none text-foreground/90 leading-relaxed font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.summary}</ReactMarkdown>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Meter Index Score */}
          <div>
            <Card className="rounded-[2rem] p-8 border-border bg-muted/10 shadow-lg text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-6">Fear & Greed Index</span>
              
              <div className="relative flex items-center justify-center">
                {/* Visual circle dial */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="60" stroke="#27272a" strokeWidth="12" fill="transparent" />
                  <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    className={cn(getScoreColor(report.score))}
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - report.score / 100)}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={cn("text-4xl font-black", getScoreColor(report.score))}>{report.score}</span>
                  <span className="text-[10px] text-muted-foreground font-bold mt-0.5">SCORE</span>
                </div>
              </div>

              <Badge variant="outline" className={cn("mt-6 text-sm font-black px-6 py-1.5 rounded-full border-none shadow-sm", getScoreProgressColor(report.score), "text-black")}>
                {report.status}
              </Badge>
              <p className="text-[10px] text-muted-foreground font-semibold text-center mt-6 leading-relaxed max-w-xs">
                Fear indexes indicate potential buying opportunities. Greed indexes often alert to price inflation.
              </p>
            </Card>
          </div>

          {/* Full Width bottom row: Article sources list */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 ml-2">Recent Coverage</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {report.articles.map((art, i) => {
                let domain = 'example.com'
                try {
                  domain = new URL(art.url).hostname
                } catch(e) {}

                return (
                  <Sheet key={i} onOpenChange={(isOpen) => { if (isOpen) setSelectedArticle(art); else setSelectedArticle(null); }}>
                    <SheetTrigger asChild>
                      <div className="block group cursor-pointer text-left h-full">
                        <Card className="p-6 bg-muted/10 border-border hover:border-zinc-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col rounded-[2rem]">
                          <div className="flex items-start gap-4 mb-4">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                              alt={domain}
                              className="w-10 h-10 rounded-xl bg-white object-contain p-1.5 shrink-0 shadow-sm ring-1 ring-border group-hover:ring-zinc-400 transition-all"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <h4 className="text-[14px] font-bold text-foreground leading-snug line-clamp-3 transition-colors">
                              {art.title}
                            </h4>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed font-semibold">
                            {art.summary}
                          </p>

                          <div className="mt-6 flex items-center justify-between pt-4 border-t border-border mt-auto">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{domain.replace('www.', '')}</span>
                            <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-none", 
                              art.sentiment === 'bullish' ? 'bg-emerald-500 text-black' : 
                              art.sentiment === 'bearish' ? 'bg-rose-500 text-black' : 'bg-zinc-650 text-white'
                            )}>
                              {art.sentiment}
                            </Badge>
                          </div>
                        </Card>
                      </div>
                    </SheetTrigger>
                    
                    {/* Read Article In Detail Sheet (Lazy Loaded with Skeleton) */}
                    <SheetContent className="w-[500px] sm:w-[700px] lg:w-[850px] border-l border-border bg-background overflow-y-auto">
                      <SheetHeader className="mb-6 text-left">
                        <div className="flex items-center gap-2 mb-4">
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={domain}
                            className="w-8 h-8 rounded-lg bg-white object-contain p-1"
                          />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{domain}</span>
                        </div>
                        <SheetTitle className="text-xl font-black text-white leading-snug">{art.title}</SheetTitle>
                        
                        <div className="flex gap-2 items-center mt-2">
                          <a href={art.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300">
                            Visit original website <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-zinc-600">|</span>
                          <Badge className={cn("text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border-none", 
                            art.sentiment === 'bullish' ? 'bg-emerald-500 text-black' : 
                            art.sentiment === 'bearish' ? 'bg-rose-500 text-black' : 'bg-zinc-650 text-white'
                          )}>
                            {art.sentiment}
                          </Badge>
                        </div>
                      </SheetHeader>

                      <div className="space-y-6 mt-8 text-left">
                        {/* Summary Block */}
                        <div className="bg-muted/20 border border-border rounded-2xl p-5">
                          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">AI Overview</h4>
                          {detailLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-[90%]" />
                              <Skeleton className="h-4 w-[95%]" />
                              <Skeleton className="h-4 w-[85%]" />
                            </div>
                          ) : detailError ? (
                            <p className="text-xs text-red-500 font-bold">{detailError}</p>
                          ) : detailData ? (
                            <p className="text-sm font-semibold text-foreground/90 leading-relaxed">
                              {detailData.summary}
                            </p>
                          ) : null}
                        </div>


                      </div>
                    </SheetContent>
                  </Sheet>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
