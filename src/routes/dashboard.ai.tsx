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
  <img src="/logo.png" className={cn("object-contain h-5 w-5", className)} alt="AI" />
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
    
    setIsShareModalOpen(true)
    
    try {
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
        fetchSessions()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex bg-background w-full h-full overflow-hidden animate-in fade-in duration-300">
      
      {/* Desktop Sidebar for Chat Sessions */}
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

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col relative h-full bg-background overflow-hidden">
        
        {/* Chat Top Header with Mobile Drawer Trigger & Black Avatar Background */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-background/90 backdrop-blur z-20 shrink-0">
          <div className="flex items-center gap-3">
            
            {/* Mobile Chat Sessions Sheet Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 text-foreground hover:bg-muted rounded-xl transition cursor-pointer border border-border flex items-center gap-1.5 text-xs font-bold">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Sessions</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-background border-r border-border p-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="font-black text-foreground text-sm">Chat History</span>
                      <button onClick={createNewSession} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                        <Plus className="h-3.5 w-3.5" /> New Chat
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[calc(100vh-120px)] overflow-y-auto">
                      {sessions.map(s => (
                        <div
                          key={s._id}
                          className={cn(
                            "w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-colors",
                            currentSessionId === s._id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                          )}
                          onClick={() => loadSession(s._id)}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{s.title || 'Conversation'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Black Circle Background for Logo Avatar */}
            <div className="h-9 w-9 rounded-full bg-black border border-zinc-700 p-1.5 flex items-center justify-center shadow-md shrink-0">
              <img src="/logo.png" className="h-full w-full object-contain" alt="AI" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Equinox GPT</h2>
            </div>
          </div>

          {currentSessionId && (
            <button 
              onClick={shareSession}
              className="text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Share Session
            </button>
          )}
        </div>

        {/* Chat Message Stream (pb-52 prevents input bar overlap) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 no-scrollbar pb-48 sm:pb-52">
          {messages.length === 0 && !isInitializing ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-90 pt-10 sm:pt-20">
              {/* Black Logo Container */}
              <div className="h-16 w-16 bg-black border border-zinc-700 rounded-3xl p-3 flex items-center justify-center mb-6 shadow-xl">
                <img src="/logo.png" className="h-full w-full object-contain" alt="AI" />
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
                  
                  {/* Black Circle Avatar Icon */}
                  <div className={cn(
                    "h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-md border border-zinc-700 bg-black text-white p-1"
                  )}>
                    {msg.role === 'ai' ? <img src="/logo.png" className="h-full w-full object-contain" alt="AI" /> : <div className="text-xs font-black text-white">U</div>}
                  </div>
                  
                  <div className={cn(
                    "flex-1 text-sm leading-relaxed break-words relative",
                    msg.role === 'user' ? "text-right" : "text-left"
                  )}>
                    <div className="font-semibold text-foreground mb-1">
                      {msg.role === 'ai' ? 'Equinox Core' : 'You'}
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
                      
                      {/* Sources */}
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
                                <button className="h-[26px] text-[10px] px-3 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-bold">
                                  View all {msg.sources.length} sources
                                </button>
                              </SheetTrigger>
                              <SheetContent className="w-[400px] sm:w-[540px] border-l-border bg-background overflow-y-auto text-left">
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
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 px-2 rounded-md font-bold">Visit</Button>
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
              <div className="h-8 w-8 shrink-0 rounded-full bg-black border border-zinc-700 p-1 flex items-center justify-center shadow-md">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
              <div className="flex-1 text-sm text-left">
                <div className="font-semibold text-foreground mb-1">
                  Equinox Core
                </div>
                <div className="text-muted-foreground font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10 pt-8 pb-4">
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
              className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:opacity-90 border-none shadow-md flex items-center justify-center transition-all disabled:opacity-50 mb-1 mr-1 cursor-pointer"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-1">Share Conversation</h3>
            <p className="text-xs text-muted-foreground font-semibold mb-6">Share this algorithmic insight with your network.</p>
            
            <div className="flex gap-2 items-center bg-muted/40 border border-border rounded-xl p-1.5 pl-3">
              <span className="text-xs text-muted-foreground font-semibold truncate flex-1 select-all">
                {`${window.location.origin}/dashboard/ai/${currentSessionId}`}
              </span>
              <button 
                onClick={copyShareLink}
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold py-2 px-4 rounded-lg transition-colors shrink-0 cursor-pointer"
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
