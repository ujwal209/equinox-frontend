import { createFileRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Compass, Star, Briefcase, TrendingUp, ArrowLeft, LogOut, Menu, X, LayoutGrid, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '../context/AuthContext'
import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


const LogoIcon = ({ className }: { className?: string }) => (
  <img src="/logo.png" className={cn("object-contain", className)} alt="AI" style={{ filter: className?.includes('text-[var(--bg-base)]') ? 'brightness(0)' : '' }} />
)

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const location = useLocation()
  const isAIPage = location.pathname.startsWith('/dashboard/ai')
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: '/login', replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
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

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-base)] animate-in fade-in duration-300">
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative h-20 w-20 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-[2rem] p-4 shadow-2xl animate-pulse ring-1 ring-white/5">
            <img src="/logo.png" alt="Equinox" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center mt-2">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.25em]">Equinox Core</h2>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Authenticating terminal session...</p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Screener', href: '/dashboard/search', icon: Compass },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: Star },
    { name: 'Recommendations', href: '/dashboard/recommendations', icon: ShieldCheck },
    { name: 'Paper Trading', href: '/dashboard/paper-trading', icon: Briefcase },
    { name: 'Sentiment', href: '/dashboard/sentiment', icon: TrendingUp },
    { name: 'Heatmap', href: '/dashboard/heatmap', icon: LayoutGrid },
    { name: 'Equinox AI', href: '/dashboard/ai', icon: LogoIcon },
  ]

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] overflow-hidden">
      
      {/* Dashboard Top Header */}
      <header className="h-16 shrink-0 border-b border-[var(--line)] bg-[var(--surface-strong)] flex items-center px-4 sm:px-6 z-20 shadow-sm relative">
        {/* Mobile Hamburger Menu */}
        <div className="md:hidden mr-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 text-white hover:bg-muted/10 rounded-xl transition cursor-pointer">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-background border-r border-border text-left p-6 overflow-y-auto">
              <div className="flex flex-col gap-8 h-full">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Equinox" className="h-8 w-auto object-contain" />
                </div>
                
                <nav className="flex flex-col gap-2 flex-1">
                  {tabs.map((tab) => {
                    const isActive = location.pathname === tab.href || (location.pathname.startsWith(tab.href) && tab.href !== '/dashboard')
                    return (
                      <SheetTrigger asChild key={tab.name}>
                        <Link
                          to={tab.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                            isActive 
                              ? "bg-white text-black shadow-sm" 
                              : "text-muted-foreground hover:text-white hover:bg-muted/10"
                          )}
                        >
                          <tab.icon className={cn("h-5 w-5", isActive ? "text-black" : "")} style={isActive ? { color: '#000000' } : undefined} />
                          <span className={cn(isActive ? "text-black" : "")} style={isActive ? { color: '#000000' } : undefined}>
                            {tab.name}
                          </span>
                        </Link>
                      </SheetTrigger>
                    )
                  })}
                </nav>

                <div className="pt-4 border-t border-border">
                  <SheetTrigger asChild>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Exit Dashboard</span>
                    </Link>
                  </SheetTrigger>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link to="/" className="flex items-center gap-2 no-underline group shrink-0 mr-4 md:mr-8">
          <img src="/logo.png" alt="Equinox" className="h-10 w-auto object-contain" />
        </Link>

        {/* Topbar Navigation (Desktop) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-full items-center gap-6">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.href || (location.pathname.startsWith(tab.href) && tab.href !== '/dashboard')
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={cn(
                  "relative flex items-center gap-2 px-1 h-full text-xs font-bold transition-all whitespace-nowrap border-b-2 border-transparent",
                  isActive
                    ? "text-white border-white"
                    : "text-[var(--sea-ink-soft)] hover:text-white"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <ButtonAsLink to="/" icon={ArrowLeft} text="Exit" className="hidden sm:flex" />



          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-9 w-9 border border-[var(--line)] cursor-pointer hover:border-[var(--sea-ink)] transition shadow-sm bg-[var(--chip-bg)]">
                  <AvatarFallback className="font-black text-xs text-[var(--sea-ink)]">
                    {user.email.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-[var(--line)] bg-[var(--surface-strong)] p-1 shadow-xl">
                <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
                  <p className="text-[10px] font-black uppercase text-[var(--sea-ink-soft)] tracking-wider">Account</p>
                  <p className="text-xs font-bold text-[var(--sea-ink)] truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer text-xs font-semibold py-2.5 text-white hover:bg-[var(--chip-bg)]">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs font-bold text-red-500 py-2.5 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      


      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Dashboard Content */}
        <main className={cn(
          "flex-1 bg-[var(--bg-base)] overflow-hidden",
          isAIPage ? "flex flex-col" : "overflow-y-auto p-4 md:p-8 pb-12 md:pb-8"
        )}>
          {isAIPage ? (
            <Outlet />
          ) : (
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function ButtonAsLink({ to, icon: Icon, text, className }: { to: string, icon: any, text: string, className?: string }) {
  return (
    <Link
      to={to}
      className={cn("hidden items-center gap-2 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:border-[var(--sea-ink)] hover:bg-[var(--surface-strong)] transition text-xs font-bold", className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
    </Link>
  )
}
