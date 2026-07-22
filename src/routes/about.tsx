import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, Shield, Zap, Globe, Cpu } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <Card className="rounded-2xl p-6 sm:p-10 mb-8 relative overflow-hidden border-[var(--line)] bg-[var(--surface)] text-left">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(54,173,163,0.1),transparent_66%)]" />
        <p className="island-kicker mb-2 text-[var(--sea-ink)] font-bold text-xs uppercase tracking-wider">About Equinox</p>
        <h1 className="display-title mb-4 text-4xl font-extrabold text-[var(--sea-ink)] sm:text-5xl tracking-tight leading-none">
          Market Suggestion & Analytics Hub
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-[var(--sea-ink-soft)] mb-6">
          Equinox is a next-generation market intelligence terminal designed to offer automated stock recommendations, buy/sell targets, and analytics summaries. Using our real-time simulated quote variations, we translate market technicals into digestible entry, target, and stop-loss levels.
        </p>
        <Link
          to="/"
          className={cn(buttonVariants({ variant: 'default' }), "bg-blue-600 hover:bg-blue-700 text-foreground border-0 inline-flex items-center gap-1 font-bold text-sm px-6 py-3 rounded-full transition no-underline h-auto")}
        >
          View Recommendations <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Card>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl p-6 border-[var(--line)] bg-[var(--surface)] text-left">
          <h2 className="text-xl font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--sea-ink)]" /> Core Infrastructure
          </h2>
          <ul className="space-y-3 text-sm text-[var(--sea-ink-soft)] pl-0 list-none">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--sea-ink)] mt-2 flex-shrink-0" />
              <span><strong>High-Performance Engine</strong>: Direct market data hydration and optimized client rendering.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--sea-ink)] mt-2 flex-shrink-0" />
              <span><strong>Google Sans Core</strong>: Custom professional fonts imported for maximum readability.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--sea-ink)] mt-2 flex-shrink-0" />
              <span><strong>Modern Interface</strong>: Built strictly around a professional color palette and streamlined user experience.</span>
            </li>
          </ul>
        </Card>

        <Card className="rounded-2xl p-6 border-[var(--line)] bg-[var(--surface)] text-left">
          <h2 className="text-xl font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-[var(--sea-ink)]" /> Target Conversion
          </h2>
          <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)] mb-4">
            Our currency conversion engine instantly transforms core price recommendations (Buy Ranges, Stops, and Price Targets) into the user's localized currency, facilitating global equity screening.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-[var(--sea-ink-soft)]">
            <Badge variant="outline" className="bg-[var(--chip-bg)] border-[var(--line)] px-2.5 py-1.5 rounded-lg text-xs font-bold h-auto">🇺🇸 USD</Badge>
            <Badge variant="outline" className="bg-[var(--chip-bg)] border-[var(--line)] px-2.5 py-1.5 rounded-lg text-xs font-bold h-auto">🇬🇧 GBP</Badge>
            <Badge variant="outline" className="bg-[var(--chip-bg)] border-[var(--line)] px-2.5 py-1.5 rounded-lg text-xs font-bold h-auto">🇪🇺 EUR</Badge>
            <Badge variant="outline" className="bg-[var(--chip-bg)] border-[var(--line)] px-2.5 py-1.5 rounded-lg text-xs font-bold h-auto">🇮🇳 INR</Badge>
            <Badge variant="outline" className="bg-[var(--chip-bg)] border-[var(--line)] px-2.5 py-1.5 rounded-lg text-xs font-bold h-auto">🇯🇵 JPY</Badge>
          </div>
        </Card>
      </section>
    </main>
  )
}
