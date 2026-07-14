import { createFileRoute, Link } from '@tanstack/react-router'
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/disclaimer')({
  component: DisclaimerPage,
})

function DisclaimerPage() {
  return (
    <main className="w-full min-h-screen bg-[var(--bg-base)] text-left py-12 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Back Link */}
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition no-underline">
            <ArrowLeft className="h-4 w-4" /> Return to Terminal
          </Link>
        </div>

        {/* Header Block */}
        <div className="space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border-zinc-800 text-zinc-400">
            Legal Documentation
          </Badge>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none flex items-center gap-3">
            <AlertTriangle className="h-9 w-9 text-zinc-400" /> Data Disclaimer
          </h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase pl-1">
            <Calendar className="h-3.5 w-3.5" /> Last Updated: July 14, 2026
          </div>
        </div>

        {/* Content Body */}
        <Card className="rounded-[2.5rem] p-8 sm:p-10 border-border bg-muted/5 space-y-6 text-xs text-muted-foreground leading-relaxed font-semibold">
          
          <div className="p-4 border border-rose-500/20 bg-rose-950/20 rounded-2xl flex items-start gap-3 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-bold uppercase tracking-wider">
              CRITICAL NOTICE: NOT FINANCIAL OR TRADING ADVICE
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">1. General Educational Purpose</h2>
            <p>
              All quantitative metrics, chart intervals, AI summaries, indicators, and model buy/sell scopes rendered on the Equinox Terminal are for educational, research, and simulation purposes only. None of the data points represent direct investment suggestions, advisory consultations, or broker recommendations.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">2. Accuracy and Delays of Market Data</h2>
            <p>
              While we ingest quote configurations from secure channels (including industry-standard market feeds), price updates may experience latency, interruptions, or transmission errors. We do not warrant the timeliness, precision, or completeness of stock quotes or sector heatmap assignments. Actual trade entries on live brokers will experience slippage and execution differences compared to our simulated paper trading platform.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">3. AI Chat and News Summaries Limitation</h2>
            <p>
              Our automated sentiment engine and our automated engines utilize large language models (such as advanced quantitative logic) to summarize market news articles and parse metrics. Large language models are prone to hallucinating facts, misinterpreting numbers, and outputting incorrect statistical projections. You must verify any AI-generated summary against official company disclosures or regulated filings before executing transactions.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">4. Assumption of Risk</h2>
            <p>
              The user assumes sole responsibility for all financial decisions and trading capital exposure. Equinox Technologies Inc., its developers, quants, and service integrations shall not be held liable for trading losses, capital drawdowns, missed profit margins, or system outages incurred through the usage of our terminal.
            </p>
          </div>

        </Card>

      </div>
    </main>
  )
}
