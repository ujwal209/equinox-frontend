import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Send, MessageSquare, ArrowLeft, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
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

export const Route = createFileRoute('/dashboard/ai/$sessionId')({
  component: DashboardAISession,
})

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

function DashboardAISession() {
  const { sessionId } = Route.useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [session, setSession] = useState<{title: string, created_at: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        setMessages(data.messages)
      } else {
        setError("Session not found or you don't have permission to view it.")
      }
    } catch (e) {
      console.error(e)
      setError("An error occurred loading the session.")
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleContinueChat = async () => {
    const jwtToken = token || localStorage.getItem('equinox_token')
    if (!jwtToken) return
    
    setIsCloning(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/sessions/${sessionId}/clone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Redirect back to main dashboard AI page. It will auto-load the latest (cloned) session
        navigate({ to: '/dashboard/ai' })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCloning(false)
    }
  }

  if (error) {
    return (
      <div className="page-wrap py-24 text-center space-y-4">
        <h3 className="text-xl font-bold text-red-500">{error}</h3>
        <Link to="/dashboard/ai" className="text-sm font-bold text-foreground hover:underline">
          Return to AI Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex bg-background w-full h-full overflow-hidden animate-in fade-in duration-300 flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/90 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/ai" className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-black border border-zinc-700 p-1 flex items-center justify-center shadow-md shrink-0">
              <img src="/logo.png" className="h-full w-full object-contain" alt="AI" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">{session?.title || 'Shared Session'}</h2>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleContinueChat}
          disabled={isCloning}
          className="text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isCloning ? 'Duplicating...' : 'Continue Chat'}
        </button>
      </div>

      {/* Chat Log */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar pb-12">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div key={msg._id || idx} className={`flex gap-4 w-full group ${msg.role === 'user' ? "flex-row-reverse" : "flex-row"}`}>
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
                  {msg.role === 'ai' ? 'Equinox AI' : 'You'}
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
                        {msg.sources.map((src, i) => {
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
      </div>
    </div>
  )
}
