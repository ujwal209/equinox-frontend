import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, Plus, Loader2, MoreVertical, Edit2, Trash2, Copy, CheckCircle2, ChevronDown, Check, Info, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export const Route = createFileRoute('/dashboard/ai')({
  component: DashboardAI,
})

interface ChatSession {
  _id: string
  title: string
  created_at: string
}

interface ChatSource {
  title: string
  url: string
  content?: string
}

interface ChatMessage {
  _id: string
  role: 'user' | 'ai'
  content: string
  sources?: ChatSource[]
}

const LogoIcon = ({ className }: { className?: string }) => (
  <img src="/logo.png" className={cn("object-contain h-4 w-4", className)} alt="AI" />
)

function DashboardAI() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [activeModel, setActiveModel] = useState('Llama 3 70B')
  
  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSessions = async () => {
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0 && !currentSessionId) {
          loadSession(data[0]._id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsInitializing(false)
    }
  }

  const loadSession = async (id: string) => {
    setCurrentSessionId(id)
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    try {
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

  const createNewSession = async () => {
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}` 
        },
        body: JSON.stringify({ title: 'New Conversation', is_shared: false })
      })
      if (res.ok) {
        const newSession = await res.json()
        setSessions([newSession, ...sessions])
        setCurrentSessionId(newSession._id)
        setMessages([])
      }
    } catch (e) {
      console.error(e)
    }
  }

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
          // Load the next available session if possible
          const remaining = sessions.filter(s => s._id !== id)
          if (remaining.length > 0) {
            loadSession(remaining[0]._id)
          }
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareSession = async () => {
    if (!currentSessionId) return
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    
    // Open the modal immediately for better UX
    setIsShareModalOpen(true)
    
    try {
      // Toggle shared state on backend
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${currentSessionId}/share`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
    } catch (e) {
      console.error(e)
    }
  }

  const copyShareLink = () => {
    if (!currentSessionId) return
    const url = `${window.location.origin}/dashboard/ai/${currentSessionId}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return

    let sessionId = currentSessionId
    if (!sessionId) {
      // Create session first
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ title: input.substring(0, 40) + '...', is_shared: false })
      })
      if (res.ok) {
        const newSession = await res.json()
        sessionId = newSession._id
        setSessions([newSession, ...sessions])
        setCurrentSessionId(sessionId)
      } else {
        return
      }
    }

    const userMessage: ChatMessage = { _id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ content: userMessage.content })
      })
      
      if (res.ok) {
        const aiMessage = await res.json()
        setMessages(prev => [...prev, aiMessage])
        fetchSessions() // Refresh titles
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex bg-background w-full h-full overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar for Sessions */}
      <div className="w-64 flex flex-col border-r border-border bg-muted/20 shrink-0 hidden md:flex animate-in slide-in-from-left-4 duration-300">
        <div className="p-4 border-b border-border">
          <button onClick={createNewSession} className="w-full flex items-center justify-start gap-2 bg-background hover:bg-muted border border-border text-foreground rounded-xl shadow-sm h-11 px-4 font-semibold text-sm transition-colors cursor-pointer">
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 no-scrollbar">
          {sessions.length === 0 && !isInitializing && (
            <div className="text-xs text-center py-4 text-muted-foreground font-medium opacity-70">
              No chat history found.
            </div>
          )}
          {sessions.map(s => (
            <div
              key={s._id}
              className={cn(
                "group w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer",
                currentSessionId === s._id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              )}
              onClick={() => {
                if (editingSessionId !== s._id) {
                  loadSession(s._id)
                }
              }}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              {editingSessionId === s._id ? (
                <Input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveRenamedSession(s._id)}
                  onBlur={() => saveRenamedSession(s._id)}
                  autoFocus
                  className="h-6 text-xs px-1.5 py-0 bg-transparent border-border text-foreground w-full"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="truncate flex-1">{s.title || "Conversation"}</span>
              )}
              
              {editingSessionId !== s._id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all hover:bg-foreground/10"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 bg-background border-border rounded-xl">
                    <DropdownMenuItem 
                      onClick={(e) => startRenaming(s._id, s.title, e)}
                      className="text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => deleteSession(s._id, e)}
                      className="text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/90 backdrop-blur z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <LogoIcon className="h-5 w-5 invert dark:invert-0" />
            <div>
              <h2 className="text-sm font-black text-foreground">Equinox GPT</h2>
            </div>
          </div>
          {currentSessionId && (
            <button 
              onClick={shareSession}
              className="text-xs font-bold bg-foreground text-background hover:bg-zinc-800 hover:text-white px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Share Session
            </button>
          )}
        </div>

        {/* Chat Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar pb-32">
          {messages.length === 0 && !isInitializing ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-90 pt-10 sm:pt-20">
              <div className="h-16 w-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-xl">
                <LogoIcon className="h-8 w-8 invert dark:invert-0" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">How can I help you today?</h3>
              <p className="text-muted-foreground font-medium mb-10 text-sm max-w-md">
                Ask me about recent market trends, specific stock performance, or ask me to find correlated assets for your portfolio.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto space-y-8">
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`flex gap-4 w-full group ${msg.role === 'user' ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={cn(
                    "h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm border border-zinc-800 bg-black text-white"
                  )}>
                    {msg.role === 'ai' ? <LogoIcon className="h-4 w-4" /> : <div className="text-xs font-bold">U</div>}
                  </div>
                  
                  <div className={cn(
                    "flex-1 text-sm leading-relaxed break-words relative",
                    msg.role === 'user' ? "text-right" : "text-left"
                  )}>
                    <div className="font-semibold text-foreground mb-1">
                      {msg.role === 'ai' ? (activeModel === 'Llama 3 70B' ? 'Equinox Core' : 'Equinox Pro') : 'You'}
                    </div>
                    <div className="text-foreground font-medium">
                      {msg.role === 'ai' ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                      
                      {/* Sources Render */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border text-left">
                          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Sources</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.sources.slice(0, 3).map((src, i) => {
                              let domain = 'example.com'
                              try { 
                                const urlObj = new URL(src.url)
                                domain = urlObj.hostname
                              } catch(e) {}
                              return (
                                <a 
                                  key={i} 
                                  href={src.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1 text-xs hover:bg-muted transition-colors max-w-[150px]"
                                >
                                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} alt="" className="h-3 w-3 shrink-0" />
                                  <span className="truncate text-foreground font-semibold">{src.title || domain}</span>
                                </a>
                              )
                            })}
                            
                            {/* Detailed Sources Sheet Trigger */}
                            <Sheet>
                              <SheetTrigger asChild>
                                <button className="h-[26px] text-[10px] px-3 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                  View all {msg.sources.length} sources
                                </button>
                              </SheetTrigger>
                              <SheetContent className="w-[400px] sm:w-[540px] border-l-border bg-background overflow-y-auto">
                                <SheetHeader className="mb-6">
                                  <SheetTitle className="text-lg font-black text-foreground">Detailed Sources</SheetTitle>
                                </SheetHeader>
                                <div className="space-y-4">
                                  {msg.sources.map((src, i) => {
                                    let domain = 'example.com'
                                    try {
                                      const urlObj = new URL(src.url)
                                      domain = urlObj.hostname
                                    } catch(e) {}
                                    return (
                                      <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-colors text-left">
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
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Copy Button */}
                    {msg.role === 'ai' && (
                      <div className="absolute -right-10 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                          onClick={() => copyToClipboard(msg.content, msg._id)}
                        >
                          {copiedId === msg._id ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="w-full max-w-4xl mx-auto flex gap-4 flex-row">
              <div className="h-8 w-8 shrink-0 rounded-full bg-foreground flex items-center justify-center shadow-sm ring-1 ring-border">
                <Loader2 className="h-4 w-4 text-background animate-spin" />
              </div>
              <div className="flex-1 text-sm text-left">
                <div className="font-semibold text-foreground mb-1">
                  {activeModel === 'Llama 3 70B' ? 'Equinox Core' : 'Equinox Pro'}
                </div>
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

        {/* Input Bar (Centered & Matches stock layout) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10 pt-10">
          <div className="w-full max-w-4xl mx-auto relative flex items-end gap-2 bg-muted/50 backdrop-blur-xl border border-border rounded-3xl p-1.5 shadow-xl ring-1 ring-black/5">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message Equinox GPT..." 
              className="flex-1 bg-transparent border-none text-foreground px-4 py-4 min-h-[60px] max-h-32 resize-none focus-visible:ring-0 font-medium text-[15px] shadow-none outline-none leading-relaxed no-scrollbar"
              disabled={isLoading}
              rows={2}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background hover:bg-zinc-800 hover:text-white border-none shadow-md flex items-center justify-center transition-all disabled:opacity-50 mb-1 mr-1 cursor-pointer"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium">Equinox GPT can make mistakes. Consider verifying important information.</p>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black text-white tracking-tight mb-1">Share Conversation</h3>
            <p className="text-xs text-zinc-400 font-semibold mb-6">Share this algorithmic insight with your network.</p>
            
            {/* Social Links */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white gap-2 group"
              >
                <div className="p-2.5 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </div>
                <span className="text-[10px] font-bold">Instagram</span>
              </a>
              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white gap-2 group"
              >
                <div className="p-2.5 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </div>
                <span className="text-[10px] font-bold">Facebook</span>
              </a>
              {/* Twitter */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white gap-2 group"
              >
                <div className="p-2.5 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </div>
                <span className="text-[10px] font-bold">Twitter</span>
              </a>
            </div>

            {/* Copyable Link */}
            <div className="flex gap-2 items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 pl-3">
              <span className="text-xs text-zinc-400 font-semibold truncate flex-1 select-all">
                {`${window.location.origin}/dashboard/ai/${currentSessionId}`}
              </span>
              <button 
                onClick={copyShareLink}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-bold py-2 px-4 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
