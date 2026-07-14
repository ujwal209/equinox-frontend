import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, Calendar, Clock, ArrowRight, Rss, Mail, Send, CheckCircle2 
} from 'lucide-react'

export const Route = createFileRoute('/blog')({
  component: BlogPage,
})

interface Article {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  summary: string
  author: string
}

function BlogPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const articles: Article[] = [
    {
      slug: 'real-time-timeseries-architecture',
      title: 'Architecting Real-Time Timeseries Charts: From Real-Time Protocols to Advanced Rendering',
      category: 'Engineering',
      date: 'July 14, 2026',
      readTime: '8 min read',
      summary: 'Explore how we optimized the Equinox Terminal chart engines to process thousands of quote updates per second. We deep-dive into high-performance loops, advanced rendering pipelines, and state aggregation mechanisms.',
      author: 'Aria Chen, Lead UX Architect'
    },
    {
      slug: 'groq-llama-sentiment-signals',
      title: 'Integrating Advanced AI Models for Financial Sentiment Parsing: A Low-Latency RAG Approach',
      category: 'Research',
      date: 'June 28, 2026',
      readTime: '12 min read',
      summary: 'An inside look at our AI sentiment model. Learn how we parse global news feeds, filter noise, construct contextual prompts containing real-time price sheets, and extract entry triggers with sub-100ms response times.',
      author: 'Dr. Kabir Nair, Head of AI Research'
    },
    {
      slug: 'mock-order-book-slippage',
      title: 'Simulating Realistic Order-Book Slippage and Margins in Paper Trading Microservices',
      category: 'Quantitative',
      date: 'June 15, 2026',
      readTime: '10 min read',
      summary: 'Paper trading terminals often fail because of perfect execution models. Read about the stochastic market model we built into the Equinox backends to calculate realistic order spreads, volatility adjustments, and execution delays.',
      author: 'Marcus Vance, Quantitative Engineer'
    }
  ]

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
  }

  return (
    <main className="w-full min-h-screen bg-[var(--bg-base)] text-left py-12 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[60%] -right-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header Block */}
        <div className="space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border-zinc-800 text-zinc-400">
            Equinox Intelligence Log
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            Research, Systems, & Infrastructure.
          </h1>
          <p className="text-base text-muted-foreground font-semibold leading-relaxed max-w-2xl">
            A technical look behind our trading algorithms, design systems, machine learning platforms, and backend aggregators.
          </p>
        </div>

        {/* Article Listings */}
        <section className="space-y-8">
          {articles.map((art) => (
            <Card key={art.slug} className="rounded-[2.5rem] border-border bg-muted/10 p-8 hover:border-zinc-700 hover:bg-muted/15 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-white text-black font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-md h-auto">
                    {art.category}
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {art.date}
                  </span>
                  <span className="text-zinc-650">•</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {art.readTime}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-zinc-300 transition-colors leading-tight">
                    {art.title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    By {art.author}
                  </span>
                  <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1 hover:translate-x-1.5 transition-transform cursor-pointer">
                    Read Article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Newsletter widget */}
        <section className="bg-muted/5 border border-border rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-48 h-48 bg-zinc-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="max-w-xl mx-auto text-center space-y-6">
            <Rss className="h-8 w-8 text-zinc-400 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Subscribe to our Engineering Log</h2>
              <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto leading-relaxed">
                Receive our monthly digest covering quantitative algorithms, platform architecture updates, and performance data releases.
              </p>
            </div>

            {subscribed ? (
              <div className="p-4 border border-emerald-500/20 bg-emerald-950/20 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 max-w-md mx-auto">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">Subscription Confirmed</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input
                  required
                  type="email"
                  placeholder="operator@system.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-border bg-background text-xs h-10 font-bold flex-1"
                />
                <Button type="submit" className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white border-0 font-black text-xs uppercase px-5 tracking-wider flex items-center gap-1.5 cursor-pointer">
                  Subscribe <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
