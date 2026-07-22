import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'
import { 
  ChevronDown, FileText, ShieldAlert, Key, 
  AlertCircle, Sun, Moon, LogOut, User, Sparkles,
  Menu, X
} from 'lucide-react'
import CurrencySelector from './CurrencySelector'
import PolicyModal from './PolicyModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'disclosure' | 'api' | 'disclaimer' | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Detect active theme on mount
    const isLight = document.documentElement.classList.contains('light')
    setTheme(isLight ? 'light' : 'dark')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(nextTheme)
    root.setAttribute('data-theme', nextTheme)
    root.style.colorScheme = nextTheme
    localStorage.setItem('theme', nextTheme)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 sm:px-6 backdrop-blur-lg">
        <nav className="page-wrap flex items-center justify-between py-4 gap-x-4">
          
          {/* 1. Left Side Logo */}
          <div className="shrink-0">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2.5 no-underline"
            >
              {theme === 'dark' && (
                <img src="/logo.png" alt="Equinox" className="h-9 w-auto object-contain" />
              )}
              <span className="font-black text-[var(--sea-ink)] text-lg tracking-wider">EQUINOX</span>
            </Link>
          </div>

          {/* 2. Desktop Middle Navigation Links */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-x-8 text-xs font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] px-2">

            <Link
              to="/search"
              className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] no-underline py-1 transition shrink-0"
              activeProps={{ className: 'text-[var(--sea-ink)]' }}
            >
              Screener
            </Link>
            <Link
              to="/heatmap"
              className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] no-underline py-1 transition shrink-0"
              activeProps={{ className: 'text-[var(--sea-ink)]' }}
            >
              Heatmap
            </Link>
            <Link
              to="/indices"
              className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] no-underline py-1 transition shrink-0"
              activeProps={{ className: 'text-[var(--sea-ink)]' }}
            >
              Indices
            </Link>
          </div>

          {/* 3. Right Actions: Theme Toggle, Currency Selector, Auth Options */}
          <div className="flex items-center gap-x-3 shrink-0">
            
            {/* Desktop Only Toggles */}
            <div className="hidden sm:flex items-center gap-x-3">
            </div>

            {/* Desktop Only Auth Options */}
            <div className="hidden md:flex items-center">
              {isAuthenticated && user ? (
                <div className="relative inline-block text-left">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-8.5 w-8.5 cursor-pointer border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] flex items-center justify-center font-extrabold text-xs uppercase hover:border-zinc-500 transition shadow">
                        <AvatarFallback className="bg-transparent font-extrabold text-xs text-[var(--sea-ink)] flex items-center justify-center size-full">
                          {user.email.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-lg z-50 overflow-hidden text-left p-1">
                      <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--chip-bg)]">
                        <span className="text-[10px] font-bold text-[var(--sea-ink-soft)] uppercase block tracking-wider">Account</span>
                        <span className="text-xs font-semibold text-[var(--sea-ink)] block truncate mt-0.5">{user.email}</span>
                      </div>
                      <div className="py-1 text-[var(--sea-ink)]">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/dashboard"
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--selection-bg)] transition block no-underline cursor-pointer"
                          >
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/dashboard/profile"
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--selection-bg)] transition block no-underline cursor-pointer"
                          >
                            Review Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            logout()
                            navigate({ to: '/login' })
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-red-400 hover:text-red-500 hover:bg-[var(--selection-bg)] bg-transparent border-none transition cursor-pointer"
                        >
                          Log Out
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-extrabold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] px-3 py-2 no-underline transition"
                  >
                    Log In
                  </Link>
                  <Button asChild className="text-xs font-extrabold px-3.5 py-2 rounded-xl shadow h-8 bg-primary text-primary-foreground border-none">
                    <Link to="/signup" className="no-underline">
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Actions: Currency selector and theme toggle for small screens */}
            <div className="sm:hidden flex items-center">
            </div>

            {/* Mobile Hamburger menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition cursor-pointer focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

          </div>

        </nav>

        {/* Mobile Navigation Menu Drawer Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--line)] bg-[var(--surface-strong)] backdrop-blur-xl px-4 py-6 space-y-6 animate-rise-in max-h-[calc(100vh-5rem)] overflow-y-auto">
            
            {/* Primary Nav Links */}
            <div className="flex flex-col gap-y-4 text-sm font-bold uppercase tracking-wider text-[var(--sea-ink-soft)]">

              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--sea-ink)] py-1.5 transition border-b border-[var(--line)]/50"
                activeProps={{ className: 'text-[var(--sea-ink)]' }}
              >
                Screener
              </Link>
              <Link
                to="/heatmap"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--sea-ink)] py-1.5 transition border-b border-[var(--line)]/50"
                activeProps={{ className: 'text-[var(--sea-ink)]' }}
              >
                Heatmap
              </Link>
              <Link
                to="/indices"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--sea-ink)] py-1.5 transition border-b border-[var(--line)]/50"
                activeProps={{ className: 'text-[var(--sea-ink)]' }}
              >
                Indices
              </Link>
            </div>

            {/* Mobile Resources collapsibles */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-[var(--sea-ink-soft)] uppercase tracking-widest block mb-1">Resources</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  { key: 'privacy', label: 'Privacy Policy', icon: FileText },
                  { key: 'terms', label: 'Terms of Service', icon: Key },
                  { key: 'disclosure', label: 'Analyst Disclosure', icon: ShieldAlert },
                  { key: 'disclaimer', label: 'General Disclaimer', icon: AlertCircle },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setActiveModal(item.key as any)
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] transition flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-3.5 w-3.5 opacity-80" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Preferences (Theme & Currency for desktop viewports mismatch) */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition cursor-pointer"
                  title="Toggle color theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--sea-ink-soft)]">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </div>
              <div className="hidden sm:flex">
                <CurrencySelector />
              </div>
            </div>

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-[var(--line)]">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[var(--line)] bg-[var(--surface-strong)] flex items-center justify-center text-[var(--sea-ink)]">
                      <AvatarFallback className="bg-transparent font-extrabold text-sm flex items-center justify-center size-full">
                        {user.email.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate text-left">
                      <span className="text-[9px] font-bold text-[var(--sea-ink-soft)] uppercase block tracking-wider">Account</span>
                      <span className="text-xs font-semibold text-[var(--sea-ink)] block truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-xl font-bold h-9 bg-[var(--sea-ink)] text-[var(--bg-base)] border-[var(--sea-ink)] hover:text-[var(--bg-base)] hover:opacity-90">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 rounded-xl font-bold h-9">
                      <Link to="/dashboard/profile" onClick={() => setMobileMenuOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                        navigate({ to: '/login' })
                      }}
                      className="flex-1 rounded-xl font-extrabold h-9 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    >
                      Log Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full rounded-xl font-bold h-10">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-xl font-extrabold h-10 bg-primary text-primary-foreground border-none">
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>

          </div>
        )}
      </header>

      {/* Privacy Policy Modal */}
      <PolicyModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <p><strong>Last Updated: July 2026</strong></p>
        <p>At Equinox, we prioritize user anonymity and local-first configurations. This policy describes how we handle device metrics and platform configurations.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">1. Information Collection</h4>
        <p>Equinox does not maintain central user databases or collect personal identifiable information (PII). We do not record search inputs, ticker additions, or IP records.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">2. Local Storage Configuration</h4>
        <p>To preserve your watchlists and selected currency settings, configuration parameters are stored locally on your device (via browser localStorage). Clearing your browser cache will reset these preferences.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">3. Third-party Analytics</h4>
        <p>Equinox does not employ external advertising trackers. Any API requests made to retrieve actual metrics (if configured) are processed direct-to-feed from client endpoints.</p>
      </PolicyModal>

      {/* Terms of Service Modal */}
      <PolicyModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
      >
        <p><strong>Last Updated: July 2026</strong></p>
        <p>By accessing the Equinox platform, you agree to comply with our localized simulation and advisory conditions.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">1. Simulation Limits</h4>
        <p>Equinox is an educational stock suggestion platform. Tickers, mock fluctuations, and converted values are simulated using algorithmic random-walk parameters and do not represent active brokerage values.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">2. Disclaimer of Liability</h4>
        <p>Equinox and its partners accept no liability for financial losses, investment results, or trading choices inspired by platform recommendations.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">3. Acceptable Use</h4>
        <p>Any scrapers or automated tools calling the server-side hydration scripts must be rate-limited to avoid degrading platform service availability.</p>
      </PolicyModal>

      {/* Analyst Disclosure Modal */}
      <PolicyModal
        isOpen={activeModal === 'disclosure'}
        onClose={() => setActiveModal(null)}
        title="Analyst Disclosure"
      >
        <p><strong>Important Financial Disclosure</strong></p>
        <p>All stock suggestions, ratings (BUY, STRONG BUY, HOLD, SELL), stop-losses, and entry ranges shown on the Equinox platform are generated algorithmically for simulation and surveillance purposes. They do not constitute certified professional financial advice, investment recommendations, or direct trading triggers.</p>
        <p>Equinox is not a registered broker-dealer, investment advisor, or regulated security terminal. We strongly advise seeking advice from a certified financial planner before executing trades in real-world equity markets.</p>
      </PolicyModal>

      {/* General Disclaimer Modal */}
      <PolicyModal
        isOpen={activeModal === 'disclaimer'}
        onClose={() => setActiveModal(null)}
        title="General Disclaimer"
      >
        <p><strong>General Safety & Risk Warning</strong></p>
        <p>Financial investments carry high levels of market risk. Capital values can fluctuate significantly, resulting in potential total loss of invested resources. The contents and recommendations of the Equinox platform are strictly simulated and provided for informational, research, and technical analysis mapping demonstrations.</p>
        <p>Past simulated performances are in no way indicative of future real-market performances. Do not make real-world investment choices solely inspired by simulated algorithms.</p>
      </PolicyModal>

      {/* API Documentation Modal */}
      <PolicyModal
        isOpen={activeModal === 'api'}
        onClose={() => setActiveModal(null)}
        title="API Documentation"
      >
        <p><strong>Equinox Developer Feeds</strong></p>
        <p>Equinox provides local API endpoints to query suggestion lists and target calculations. These endpoints hydrate data structures directly from our TanStack Start server functions.</p>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">1. Suggestions Feed</h4>
        <pre className="bg-muted/40 border border-border p-3 rounded-lg text-xs overflow-x-auto text-zinc-300">
{`GET /api/suggestions?currency=USD
Response:
{
  "symbol": "AAPL",
  "rating": "BUY",
  "target": 215.00,
  "entryRange": [185.00, 190.00],
  "stopLoss": 178.00
}`}
        </pre>
        <h4 className="font-bold text-[var(--sea-ink)] mt-4 mb-2">2. WebSocket Live Feed</h4>
        <p>Connect to the mock feed at `ws://localhost:3000/api/ticks` to retrieve live JSON updates as price random walks compile.</p>
      </PolicyModal>

    </>
  )
}
