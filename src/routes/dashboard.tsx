import { createFileRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { 
  LayoutDashboard, Compass, Star, Briefcase, TrendingUp, ArrowLeft, 
  LogOut, Menu, LayoutGrid, Mail, ChevronLeft, ChevronRight, PanelLeft,
  Sun, Moon, MessageSquare
} from 'lucide-react'
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('equinox_sidebar_collapsed') === 'true'
    }
    return false
  })

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

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('equinox_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-base)] animate-in fade-in duration-300">
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative h-20 w-20 flex items-center justify-center bg-[var(--surface-strong)] border border-[var(--line)] rounded-[2rem] p-4 shadow-2xl animate-pulse">
            <span className="font-black text-2xl text-[var(--sea-ink)]">EQUINOX</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center mt-2">
            <h2 className="text-sm font-black text-[var(--sea-ink)] uppercase tracking-[0.25em]">Equinox Core</h2>
            <p className="text-[9px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-widest mt-1">Authenticating terminal session...</p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Screener', href: '/dashboard/search', icon: Compass },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: Star },
    { name: 'AI Email Alerts', href: '/dashboard/email-alerts', icon: Mail },
    { name: 'Paper Trading', href: '/dashboard/paper-trading', icon: Briefcase },
    { name: 'Sentiment', href: '/dashboard/sentiment', icon: TrendingUp },
    { name: 'Heatmap', href: '/dashboard/heatmap', icon: LayoutGrid },
    { name: 'Equinox AI', href: '/dashboard/ai', icon: MessageSquare },
  ]

  return (
    <div className="h-screen w-screen flex bg-[var(--bg-base)] overflow-hidden text-left">
      
      {/* Desktop Sidebar (Collapsible Left Rail) */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r border-[var(--line)] bg-[var(--surface-strong)] transition-all duration-300 z-30 shrink-0 select-none relative",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header / Logo (Text only in light mode, logo + text in dark mode) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--line)] shrink-0">
          <Link to="/" className="flex items-center gap-3 no-underline overflow-hidden">
            {/* Show logo image ONLY in dark mode */}
            {theme === 'dark' && (
              <img src="/logo.png" alt="Equinox" className="h-8 w-auto object-contain shrink-0" />
            )}
            {(!isCollapsed || theme === 'light') && (
              <span className="font-black text-[var(--sea-ink)] text-base tracking-tight truncate">
                EQUINOX
              </span>
            )}
          </Link>
          
          <button
            onClick={toggleSidebar}
            className="p-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar Nav Links with Guaranteed Opposite Black/White Contrast */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.href || (location.pathname.startsWith(tab.href) && tab.href !== '/dashboard')
            
            // Dynamic theme-aware contrast styles
            const activeStyle = theme === 'dark' 
              ? "bg-white text-black shadow-xl font-black scale-[1.01]" 
              : "bg-black text-white shadow-xl font-black scale-[1.01]"
              
            const inactiveStyle = theme === 'dark'
              ? "text-zinc-400 hover:text-white hover:bg-zinc-800/80 font-bold hover:translate-x-1.5"
              : "text-zinc-600 hover:text-black hover:bg-zinc-200/80 font-bold hover:translate-x-1.5"

            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs transition-all duration-200 cursor-pointer group relative overflow-hidden",
                  isActive ? activeStyle : inactiveStyle
                )}
                style={isActive ? {
                  backgroundColor: theme === 'dark' ? '#ffffff' : '#000000',
                  color: theme === 'dark' ? '#000000' : '#ffffff'
                } : undefined}
                title={isCollapsed ? tab.name : undefined}
              >
                <tab.icon 
                  className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "stroke-[2.5]" : "")} 
                  style={isActive ? { color: theme === 'dark' ? '#000000' : '#ffffff' } : undefined}
                />
                {!isCollapsed && (
                  <span 
                    className="truncate tracking-tight font-black"
                    style={isActive ? { color: theme === 'dark' ? '#000000' : '#ffffff' } : undefined}
                  >
                    {tab.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer User Info & Exit */}
        <div className="p-3 border-t border-[var(--line)] space-y-2 shrink-0">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Exit Dashboard" : undefined}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Exit Terminal</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area + Top Header */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Header Topbar */}
        <header className="h-16 shrink-0 border-b border-[var(--line)] bg-[var(--surface-strong)] flex items-center justify-between px-4 sm:px-6 z-20">
          
          {/* Mobile Sheet Trigger + Collapse Trigger */}
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 text-[var(--sea-ink)] hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-xl transition cursor-pointer">
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-[var(--surface-strong)] border-r border-[var(--line)] text-left p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                      {theme === 'dark' && (
                        <img src="/logo.png" alt="Equinox" className="h-8 w-auto object-contain" />
                      )}
                      <span className="font-black text-[var(--sea-ink)] tracking-wider text-sm">EQUINOX</span>
                    </div>
                    
                    <nav className="space-y-2">
                      {tabs.map((tab) => {
                        const isActive = location.pathname === tab.href || (location.pathname.startsWith(tab.href) && tab.href !== '/dashboard')
                        return (
                          <SheetTrigger asChild key={tab.name}>
                            <Link
                              to={tab.href}
                              className={cn(
                                "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm transition-all duration-200",
                                isActive 
                                  ? (theme === 'dark' ? "bg-white text-black font-black" : "bg-black text-white font-black")
                                  : (theme === 'dark' ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-zinc-600 hover:text-black hover:bg-zinc-200")
                              )}
                              style={isActive ? {
                                backgroundColor: theme === 'dark' ? '#ffffff' : '#000000',
                                color: theme === 'dark' ? '#000000' : '#ffffff'
                              } : undefined}
                            >
                              <tab.icon 
                                className="h-5 w-5" 
                                style={isActive ? { color: theme === 'dark' ? '#000000' : '#ffffff' } : undefined}
                              />
                              <span style={isActive ? { color: theme === 'dark' ? '#000000' : '#ffffff' } : undefined}>
                                {tab.name}
                              </span>
                            </Link>
                          </SheetTrigger>
                        )
                      })}
                    </nav>
                  </div>

                  <div className="pt-4 border-t border-[var(--line)]">
                    <SheetTrigger asChild>
                      <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Exit Terminal</span>
                      </Link>
                    </SheetTrigger>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center gap-2 text-xs font-bold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <PanelLeft className="h-4 w-4" />
              <span>{isCollapsed ? "Expand" : "Collapse"}</span>
            </button>
          </div>

          {/* Right Header Options (Theme Toggle + User Dropdown) */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition cursor-pointer flex items-center gap-2 text-xs font-black"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
              <span className="hidden sm:inline-block uppercase tracking-wider text-[10px]">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none cursor-pointer">
                  <div className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-[var(--chip-bg)] transition border border-transparent hover:border-[var(--line)]">
                    <Avatar className="h-8 w-8 border border-[var(--line)] bg-[var(--chip-bg)]">
                      <AvatarFallback className="font-black text-xs text-[var(--sea-ink)]">
                        {user.email.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block text-xs font-black text-[var(--sea-ink)] truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[var(--line)] bg-[var(--surface-strong)] p-1 shadow-2xl text-left">
                  <div className="px-3 py-2.5 border-b border-[var(--line)] mb-1">
                    <p className="text-[10px] font-black uppercase text-[var(--sea-ink-soft)] tracking-widest">Account Session</p>
                    <p className="text-xs font-bold text-[var(--sea-ink)] truncate mt-0.5">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-xs font-bold py-2.5 text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] rounded-xl">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs font-bold text-rose-500 py-2.5 hover:bg-rose-500/10 rounded-xl">
                    <LogOut className="h-4 w-4 mr-2" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Main Dashboard Workspace Content */}
        <main className={cn(
          "flex-1 bg-[var(--bg-base)] overflow-hidden min-w-0",
          isAIPage ? "flex flex-col" : "overflow-y-auto p-4 md:p-8 pb-16 md:pb-8"
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
