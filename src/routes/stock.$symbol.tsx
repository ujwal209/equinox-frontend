import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import {
  ChevronLeft,
  Award,
  Sparkles,
  Activity,
  Loader2,
  Send,
  BrainCircuit,
  X,
  MessageSquare,
  Plus,
  ChevronDown,
  Zap
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import CandlestickChart from '@/components/CandlestickChart'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const Route = createFileRoute('/stock/$symbol')({
  component: StockDetailPage,
})

function StockDetailPage() {
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()
  const { symbol } = Route.useParams()
  const { convert } = useCurrency()

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle')
  const [logoError, setLogoError] = useState(false)
  
  // AI State
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [input, setInput] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false)

  const [messages, setMessages] = useState<any[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [activeModel, setActiveModel] = useState('Llama 3 70B')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (showAIPanel) {
      fetchSessions()
    }
  }, [showAIPanel])

  
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      if (res.ok) {
        setSessions(sessions.filter(s => s._id !== id))
        if (currentSessionId === id) {
          setCurrentSessionId(null)
          setMessages([])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const startRenaming = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(id)
    setEditTitle(currentTitle)
  }

  const saveRenamedSession = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null)
      return
    }
    
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}` 
        },
        body: JSON.stringify({ title: editTitle })
      })
      if (res.ok) {
        setSessions(sessions.map(s => s._id === id ? { ...s, title: editTitle } : s))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEditingSessionId(null)
    }
  }

  const fetchSessions = async () => {
    try {
      const jwtToken = token || localStorage.getItem('equinox_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadSession = async (id: string) => {
    setCurrentSessionId(id)
    try {
      const jwtToken = token || localStorage.getItem('equinox_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${id}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const timeframes = [
    { label: '1D', range: '1d', interval: '5m' },
    { label: '1W', range: '5d', interval: '15m' },
    { label: '1M', range: '1mo', interval: '1d' },
    { label: '3M', range: '3mo', interval: '1d' },
    { label: '1Y', range: '1y', interval: '1d' },
    { label: '5Y', range: '5y', interval: '1wk' },
  ]
  const [timeframe, setTimeframe] = useState(timeframes[2])

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const jwtToken = token || localStorage.getItem('equinox_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/timeseries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
          },
          body: JSON.stringify({ symbol, range: timeframe.range, interval: timeframe.interval })
        })
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        if (active) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    fetchData()

    const fetchSentiment = async () => {
      setIsLoadingSentiment(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/sentiment/${symbol}`)
        if (res.ok) {
          const result = await res.json()
          setSentimentData(result)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingSentiment(false)
      }
    }
    fetchSentiment()
    return () => { active = false }
  }, [symbol, timeframe])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoadingAI, showAIPanel])

  const sendAIMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || isLoadingAI) return
    if (!textOverride) setInput('')
    
    setMessages(prev => [...prev, { role: 'user', content: textToSend }])
    setIsLoadingAI(true)
    
    try {
      const jwtToken = token || localStorage.getItem('equinox_token');
      
      let sessionId = currentSessionId;
      if (!sessionId) {
        const createRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}) },
          body: JSON.stringify({ title: `${symbol} Analysis - ${textToSend.substring(0, 20)}...`, is_shared: false, context_symbol: symbol })
        });
        if (createRes.ok) {
          const newSess = await createRes.json();
          sessionId = newSess._id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [newSess, ...prev]);
        }
      }

      const res = await fetch(sessionId ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${sessionId}/message` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify(
          sessionId ? { content: textToSend, context: { symbol, marketData: data ? { price: data.price, change: data.change } : null } } : {
            message: textToSend,
            history: messages,
            model: activeModel,
            context: { symbol, marketData: data ? { price: data.price, change: data.change } : null }
          }
        )
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || 'Failed to fetch AI response')
      setMessages(prev => [...prev, sessionId ? result : { role: 'ai', content: result.message || result.response || "No response", sources: result.sources || [] }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't connect to Equinox GPT right now." }])
    } finally {
      setIsLoadingAI(false)
    }
  }

  const getCompanyLogo = (sym: string) => {
    const s = sym.toUpperCase().split('.')[0]
    if (sym.includes('.')) {
      return `https://eodhd.com/img/logos/NSE/${s}.png`
    }
    return `https://eodhd.com/img/logos/US/${s}.png`
  }

  const getDomain = (sym: string) => {
    if (!sym) return 'example.com';
    const s = sym.split('.')[0].toUpperCase();
    const map: Record<string, string> = {
      'RELIANCE': 'ril.com',
      'TCS': 'tcs.com',
      'HDFCBANK': 'hdfcbank.com',
      'ICICIBANK': 'icicibank.com',
      'INFY': 'infosys.com',
      'SBIN': 'onlinesbi.sbi',
      'BHARTIARTL': 'airtel.in',
      'ITC': 'itcportal.com',
      'ZOMATO': 'zomato.com',
      'WOCKPHARMA': 'wockhardt.com',
      'TATAMOTORS': 'tatamotors.com',
      'SUNPHARMA': 'sunpharma.com',
      'BAJFINANCE': 'bajajfinserv.in',
      'MARUTI': 'marutisuzuki.com',
      'HINDUNILVR': 'hul.co.in'
    };
    return map[s] || `${s.toLowerCase()}.com`;
  }

  if (isLoading && !data) {
    return (
      <div className="w-full h-[90vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-zinc-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-bold">Connecting to Market Feeds...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full h-[90vh] flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="text-2xl font-black text-foreground">Stock Not Found</h3>
        <p className="text-muted-foreground font-medium">Could not retrieve market chart data for {symbol}.</p>
        <Link to="/" className={cn(buttonVariants({ variant: 'default' }), "rounded-xl px-8")}>
          Return to Terminal
        </Link>
      </div>
    )
  }

  const isBuy = data.changePercent > 0
  const isPositive = data.change >= 0

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  }

  const aiChatInterface = (
    <div className="flex h-full bg-background rounded-l-2xl overflow-hidden">
      <div className="hidden md:flex w-64 flex-col border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <Button onClick={() => { setCurrentSessionId(null); setMessages([]); setInput(''); }} className="w-full justify-start gap-2 bg-background hover:bg-muted border border-border text-foreground rounded-xl shadow-sm h-11 font-semibold">
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No recent chats</div>
          ) : (
            sessions.map(s => (
              <div
                key={s._id}
                onClick={() => { if (editingSessionId !== s._id) loadSession(s._id); }}
                className={cn(
                  "group w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer",
                  currentSessionId === s._id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {editingSessionId === s._id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenamedSession(s._id)
                      else if (e.key === 'Escape') setEditingSessionId(null)
                    }}
                    onBlur={() => saveRenamedSession(s._id)}
                    className="flex-1 bg-transparent border-none text-foreground focus:outline-none p-0 h-4 text-xs font-semibold"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="flex-1 truncate">{s.title || `Chat - ${s._id.substring(0,6)}`}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded transition outline-none">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-card border border-border rounded-xl p-1 z-50">
                        <DropdownMenuItem onClick={(e) => startRenaming(s._id, s.title, e)} className="text-xs font-semibold cursor-pointer">
                          <Edit2 className="h-3 w-3 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => deleteSession(s._id, e)} className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer">
                          <Trash2 className="h-3 w-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        <div className="h-16 shrink-0 border-b border-border bg-background px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            <span className="font-extrabold text-foreground text-sm">Equinox GPT Terminal</span>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu open={isModelDropdownOpen} onOpenChange={setIsModelDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 text-xs font-bold bg-muted/50 hover:bg-muted text-foreground border border-border rounded-xl">
                  {activeModel} <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border border-border rounded-xl p-1 z-50">
                {['Llama 3 70B', 'Mixtral 8x7B'].map((model) => (
                  <DropdownMenuItem key={model} onClick={() => { setActiveModel(model); setIsModelDropdownOpen(false); }} className="text-xs font-semibold cursor-pointer">{model}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted rounded-xl border border-border"><X className="h-4 w-4" /></Button>
            </SheetTrigger>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-36 no-scrollbar bg-background">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            {messages.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <BrainCircuit className="h-12 w-12 text-indigo-500 mx-auto animate-pulse" />
                <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Algorithmic Thesis Agent</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-semibold">
                  Ask Equinox GPT to summarize timeseries metrics, technical charts, analyst indicators, or general financial statistics for {symbol}.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className="flex gap-4 flex-row">
                  <div className={cn(
                    "h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ring-1 ring-border",
                    m.role === 'user' ? "bg-zinc-800 text-foreground" : "bg-foreground text-background"
                  )}>
                    {m.role === 'user' ? (user?.email?.slice(0,2) || 'US') : 'EQ'}
                  </div>
                  <div className="flex-1 text-sm leading-relaxed overflow-hidden">
                    <div className="font-semibold text-foreground mb-1">
                      {m.role === 'user' ? 'Local Operator' : (activeModel === 'Llama 3 70B' ? 'Equinox Core' : 'Equinox Pro')}
                    </div>
                    <div className="prose prose-sm dark:prose-invert prose-zinc max-w-none text-foreground/90 font-medium leading-relaxed prose-p:text-zinc-100 prose-headings:text-zinc-100 prose-strong:text-zinc-100 text-zinc-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Sources Referenced</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {m.sources.map((src: any, i: number) => {
                            let domain = 'example.com';
                            try { domain = new URL(src.url).hostname } catch(e){}
                            return (
                              <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="h-5 w-5 shrink-0 rounded-sm" />
                                    <h4 className="text-sm font-bold text-foreground truncate">{src.title || domain}</h4>
                                  </div>
                                  <a href={src.url} target="_blank" rel="noreferrer" className="shrink-0">
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 px-2 rounded-md">Visit</Button>
                                  </a>
                                </div>
                                {src.content && (
                                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
                                    {src.content}
                                  </p>
                                )}
                                <span className="text-[10px] text-muted-foreground opacity-70 truncate">{src.url}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoadingAI && (
              <div className="flex gap-4 flex-row">
                <div className="h-8 w-8 shrink-0 rounded-full bg-foreground flex items-center justify-center shadow-sm ring-1 ring-border">
                  <Loader2 className="h-4 w-4 text-background animate-spin" />
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-semibold text-foreground mb-1">{activeModel === 'Llama 3 70B' ? 'Equinox Core' : 'Equinox Pro'}</div>
                  <div className="text-muted-foreground font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10 pt-10">
          <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-muted/50 backdrop-blur-xl border border-border rounded-3xl p-1.5 shadow-xl ring-1 ring-black/5">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendAIMessage();
                }
              }}
              placeholder={`Message Equinox GPT...`} 
              className="flex-1 bg-transparent border-none text-foreground px-4 py-4 min-h-[60px] max-h-32 resize-none focus-visible:ring-0 font-medium text-[15px] shadow-none outline-none leading-relaxed no-scrollbar"
              disabled={isLoadingAI}
              rows={2}
            />
            <Button 
              onClick={() => sendAIMessage()}
              disabled={isLoadingAI || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background hover:bg-zinc-800 hover:text-foreground border-none shadow-md flex items-center justify-center transition-all disabled:opacity-50 mb-1 mr-1"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium">Equinox GPT can make mistakes. Consider verifying important information.</p>
        </div>
      </div>
    </div>
  )

  return (
    <main className="w-full min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <div className="w-full px-2 sm:px-4 pt-6 pb-4">
        <div className="mb-4 ml-2">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition no-underline">
            <ChevronLeft className="h-4 w-4" /> Terminal
          </Link>
        </div>
        
        <section className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-[2rem] bg-background/40 dark:bg-background/20 backdrop-blur-2xl border border-border shadow-lg overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative flex items-center gap-5 z-10 text-left">
            {!logoError ? (
              <img 
                src={getCompanyLogo(symbol)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const s = symbol.toUpperCase().split('.')[0];
                  if (target.src.includes(`/NSE/${s}.png`)) {
                    target.src = `https://eodhd.com/img/logos/NSE/${s.toLowerCase()}.png`;
                  } else if (target.src.includes(`/US/${s}.png`)) {
                    target.src = `https://eodhd.com/img/logos/US/${s.toLowerCase()}.png`;
                  } else if (target.src.includes('eodhd.com')) {
                    const domain = getDomain(symbol);
                    if (domain) {
                      target.src = `https://cdn.brandfetch.io/domain/${domain}?c=1idlu8B6H0L485PeI84`;
                    } else {
                      setLogoError(true);
                    }
                  } else {
                    setLogoError(true);
                  }
                }}
                className="h-20 w-20 rounded-2xl object-contain bg-white shadow-xl ring-1 ring-border p-1.5"
                alt={`${symbol} logo`}
              />
            ) : (
              <div className="h-20 w-20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-foreground shadow-xl rounded-2xl flex items-center justify-center font-black text-2xl uppercase ring-1 ring-border">
                {symbol.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'EQ'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-foreground tracking-tight">{data.symbol}</h1>
                <Badge variant="default" className="text-xs font-bold px-3 py-1 rounded-full border-none h-auto bg-zinc-500/10 text-foreground">
                  {data.changePercent > 2 ? 'STRONG BUY' : isBuy ? 'BUY' : 'HOLD'}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mt-1">{data.name}</p>
            </div>
          </div>

          <div className="relative z-10 text-left md:text-right flex flex-col md:items-end gap-3">
            <div>
              <h2 className="text-4xl font-black text-foreground tracking-tight">{formatINR(data.price)}</h2>
              <p className="text-sm mt-1 flex items-center md:justify-end gap-2 font-bold">
                <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${isPositive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                <span className={isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}>
                  {data.change > 0 ? '+' : ''}{formatINR(data.change)} ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
                </span>
              </p>
            </div>
            {isAuthenticated ? (
              <Button onClick={() => setShowAIPanel(true)} className="flex gap-2 bg-foreground hover:bg-zinc-800 text-background rounded-2xl h-12 px-6 shadow-md transition-all active:scale-95 border border-transparent">
                <img src="/logo.png" className="h-4 w-4 object-contain invert" alt="Equinox Logo" /> 
                <span className="font-bold">Equinox GPT</span>
              </Button>
            ) : (
              <Button onClick={() => navigate({ to: '/login' })} className="flex gap-2 bg-muted/40 hover:bg-zinc-850 text-foreground rounded-2xl h-12 px-6 shadow-md transition-all active:scale-95 border border-border">
                <span className="font-bold">Sign In for AI Analysis</span>
              </Button>
            )}
          </div>
        </section>
      </div>

      <div className="w-full flex-1 relative flex flex-col px-0 sm:px-2 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 px-4 sm:px-2">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-500" /> Interactive Timeseries
          </span>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/80 backdrop-blur-md rounded-xl p-1 shadow-inner border border-border">
              <button onClick={() => setChartType('candle')} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", chartType === 'candle' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Candle</button>
              <button onClick={() => setChartType('line')} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", chartType === 'line' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Line</button>
            </div>
            <div className="flex bg-muted/80 backdrop-blur-md rounded-xl p-1 shadow-inner border border-border">
              {timeframes.map((tf) => (
                <button key={tf.label} onClick={() => setTimeframe(tf)} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", timeframe.label === tf.label ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tf.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex-1 min-h-[600px] sm:min-h-[750px] relative rounded-none sm:rounded-2xl overflow-hidden bg-background/20 ring-0 sm:ring-1 ring-border">
          {data.points && data.points.length > 0 ? (
            <CandlestickChart data={data.points} type={chartType} />
          ) : (
            <div className="w-full h-full min-h-[600px] flex items-center justify-center text-muted-foreground font-bold">No chart data available.</div>
          )}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 pb-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-zinc-800 p-2.5 rounded-xl text-zinc-100 ring-1 ring-border">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Market Sentiment & News</h2>
        </div>

        {isLoadingSentiment ? (
          <div className="w-full rounded-[2rem] bg-muted/30 border border-border p-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-850" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-850 rounded-md w-1/4" />
                <div className="h-3 bg-zinc-850 rounded-md w-1/3" />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="h-4 bg-zinc-850 rounded-md w-full" />
              <div className="h-4 bg-zinc-850 rounded-md w-11/12" />
              <div className="h-4 bg-zinc-850 rounded-md w-5/6" />
              <div className="h-4 bg-zinc-850 rounded-md w-3/4" />
            </div>
          </div>
        ) : sentimentData ? (
          <div className="space-y-8">
            <Card className="rounded-[2rem] p-8 bg-muted/30 border border-border shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/4 shrink-0 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-6 flex flex-col justify-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">Overall Sentiment</span>
                  <Badge variant="default" className={cn("text-xl font-black px-6 py-2 rounded-full shadow-sm w-fit", 
                    sentimentData.sentiment === 'BULLISH' ? "bg-foreground text-background" : 
                    sentimentData.sentiment === 'BEARISH' ? "bg-zinc-600 text-zinc-100" : "bg-zinc-500 text-foreground"
                  )}>
                    {isAuthenticated ? (sentimentData.sentiment?.toUpperCase() || 'NEUTRAL') : 'LOCKED'}
                  </Badge>
                </div>
                
                <div className="lg:w-3/4 relative">
                  <div className={cn("prose prose-sm dark:prose-invert prose-zinc max-w-none text-foreground/90 leading-relaxed font-medium prose-p:text-zinc-100 prose-headings:text-zinc-100 prose-strong:text-zinc-100 text-zinc-100", !isAuthenticated && "blur-md select-none pointer-events-none")}>
                    <ReactMarkdown>{sentimentData.summary}</ReactMarkdown>
                  </div>
                  {!isAuthenticated && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl p-4 text-center z-20">
                      <p className="text-sm font-black text-foreground uppercase tracking-wider mb-2">Unlock AI Sentiment Analysis</p>
                      <p className="text-xs text-muted-foreground font-semibold mb-4 max-w-xs leading-relaxed">Create a free account or sign in to view real-time AI news summaries and market triggers.</p>
                      <Button asChild className="rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs h-9 px-5">
                        <Link to="/login" className="no-underline">Sign In</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 ml-2">Recent Coverage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentimentData.sources?.map((source: any, i: number) => {
                  let domain = 'example.com';
                  try { domain = new URL(source.url).hostname; } catch (e) {}
                  return (
                    <a key={i} href={source.url} target="_blank" rel="noreferrer" className="block group h-full">
                      <Card className="p-6 bg-muted/20 border border-border hover:border-zinc-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col rounded-[2rem]">
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={domain}
                            className="w-10 h-10 rounded-xl bg-white object-contain p-1.5 shrink-0 shadow-sm ring-1 ring-border group-hover:ring-zinc-400 transition-all grayscale group-hover:grayscale-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <h4 className="text-[15px] font-bold text-foreground leading-snug line-clamp-3 transition-colors">
                            {source.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-4 mt-auto leading-relaxed font-medium">
                          {source.content}
                        </p>
                      </Card>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 rounded-[2rem] bg-muted/30 border border-border flex items-center justify-center">
            <p className="text-sm font-bold text-muted-foreground">Unable to fetch market sentiment at this time.</p>
          </div>
        )}
      </div>

      <Sheet open={showAIPanel} onOpenChange={setShowAIPanel}>
        <SheetContent side="right" className="!w-[100vw] sm:!max-w-[95vw] lg:!max-w-[85vw] p-0 border-l border-border flex flex-col h-full !rounded-l-2xl sm:mr-4 sm:my-4 sm:h-[calc(100vh-2rem)] sm:shadow-2xl">
          {aiChatInterface}
        </SheetContent>
      </Sheet>
    </main>
  )
}
