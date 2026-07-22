import { createFileRoute, Link } from '@tanstack/react-router'
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scale, Calendar, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <main className="w-full min-h-screen bg-[var(--bg-base)] text-left py-12 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Back Link */}
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition no-underline">
            <ArrowLeft className="h-4 w-4" /> Return to Terminal
          </Link>
        </div>

        {/* Header Block */}
        <div className="space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-muted/40 border-border text-zinc-400">
            Legal Documentation
          </Badge>
          <h1 className="text-4xl font-black text-foreground tracking-tight leading-none flex items-center gap-3">
            <Scale className="h-9 w-9 text-zinc-400" /> Terms of Service
          </h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase pl-1">
            <Calendar className="h-3.5 w-3.5" /> Last Updated: July 14, 2026
          </div>
        </div>

        {/* Content Body */}
        <Card className="rounded-[2.5rem] p-8 sm:p-10 border-border bg-muted/5 space-y-6 text-xs text-muted-foreground leading-relaxed font-semibold">
          
          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">1. Agreement to Terms</h2>
            <p>
              By installing, accessing, or interacting with the Equinox Market Terminal (the "Platform" or "Service"), you agree to be bound by these Terms of Service. If you do not accept these guidelines, you must cease using the application immediately.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">2. Account Registration and Security</h2>
            <p>
              Access to specific algorithmic tools (such as AI sentiment triggers, watchlists, paper-trading, and AI sentiment tools) requires user registration. You agree to submit true, complete account info and are solely responsible for securing your login tokens. We are not liable for session compromises caused by weak password configurations.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">3. Permitted Platform Usage</h2>
            <p>
              Equinox grants users a limited, non-exclusive, non-transferable, revocable license to access financial analytics charts and tickers. You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Deploy high-frequency scraping scripts or bots to extract our aggregated database quotes.</li>
              <li>Reverse engineer the backend routes or frontend layout architectures.</li>
              <li>Circumvent paywalls or restrictions designed to manage system limits.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">4. Simulated Paper Trading</h2>
            <p>
              All balances, holdings, short orders, or margin logs processed inside our Paper Trading modules are strictly simulated. No actual fiat currencies or equities are transacted, cleared, or processed. The simulated rates represent close approximations and should not be used as live arbitrage signals.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">5. Intellectual Property</h2>
            <p>
              The layout systems, design tokens, dashboard code, and database schemas are the intellectual property of Equinox Technologies Inc. Market data and logos are copyrighted assets owned by their respective financial networks.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">6. Termination Rights</h2>
            <p>
              We reserve the right to suspend or terminate user accounts that violate our usage guidelines, execute abusive DB queries, or bypass security rules, without notice or liability.
            </p>
          </div>

        </Card>

      </div>
    </main>
  )
}
