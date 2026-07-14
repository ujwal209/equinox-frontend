import { createFileRoute, Link } from '@tanstack/react-router'
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Calendar, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
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
            <ShieldCheck className="h-9 w-9 text-zinc-400" /> Privacy Policy
          </h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase pl-1">
            <Calendar className="h-3.5 w-3.5" /> Last Updated: July 14, 2026
          </div>
        </div>

        {/* Content Body */}
        <Card className="rounded-[2.5rem] p-8 sm:p-10 border-border bg-muted/5 space-y-6 text-xs text-muted-foreground leading-relaxed font-semibold">
          
          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">1. Scope and Consent</h2>
            <p>
              This Privacy Policy explains how Equinox Technologies Inc. ("Equinox", "we", "us", or "our") collects, uses, protects, and handles user credentials and device configurations. By deploying or visiting the Equinox Financial Terminal, you consent to our practices described herein.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">2. Information Collection</h2>
            <p>
              We compile essential operational data points to authorize and route your sessions:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>User Identity Data:</strong> Account email addresses and encrypted password digests entered during registration.</li>
              <li><strong>Session Credentials:</strong> JSON Web Tokens (JWT) stored locally on your device to retain terminal login states.</li>
              <li><strong>Terminal State Log:</strong> Tickers added to your watchlist, custom paper-trading order records, and user configuration preferences.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">3. Caching and Cookie Usage</h2>
            <p>
              Equinox does not employ commercial advertising trackers. We utilize browser LocalStorage and Secure Cookies exclusively to persist user tokens, preferred base currency units, and theme locks (dark mode attributes).
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">4. Third-Party API Services</h2>
            <p>
              We route market data lookup requests to external CDNs and database endpoints (including secure financial data providers). These networks may record IP locations to authenticate data loads. When interacting with our proprietary AI systems, chat context is triaged using secure secure data gateways gateways. No personally identifiable account data is forwarded.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">5. Security Standards</h2>
            <p>
              We encrypt database collections and transmit all communications over TLS/HTTPS tunnels. Security groups and firewall gates filter incoming WebSocket connections. Despite our standards, no electronic communication network can be guaranteed 100% impenetrable. Users should retain strong password routines.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">6. Contact Inquiries</h2>
            <p>
              For data access queries, compliance requests, or deletion tickets, please email our operations desk at: <a href="mailto:privacy@equinox.tech" className="text-white hover:underline">privacy@equinox.tech</a>.
            </p>
          </div>

        </Card>

      </div>
    </main>
  )
}
