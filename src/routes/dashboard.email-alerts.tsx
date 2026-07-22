import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Mail,
  Zap,
  Clock,
  Send,
  Check,
  RefreshCw,
  List,
  Bell
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/email-alerts')({
  component: EmailAlertsPage,
})

function EmailAlertsPage() {
  const { token, user } = useAuth()
  
  const [frequency, setFrequency] = useState<'1h' | '2h' | '4h' | 'daily' | 'off'>('1h')
  const [enabled, setEnabled] = useState(true)
  const [intradayFocus, setIntradayFocus] = useState(true)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([])

  const fetchSettings = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/user/email-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setFrequency(data.settings.frequency || '1h')
          setEnabled(data.settings.enabled ?? true)
          setIntradayFocus(data.settings.intraday_focus ?? true)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWatchlist = async () => {
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const symbols = new Set<string>()
        if (Array.isArray(data)) {
          data.forEach((w: any) => {
            (w.symbols || []).forEach((s: string) => symbols.add(s))
          })
        }
        setWatchlistSymbols(Array.from(symbols))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchWatchlist()
  }, [token])

  const handleSaveSettings = async () => {
    if (!token) return
    setIsSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/user/email-alerts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frequency,
          enabled,
          intraday_focus: intradayFocus
        })
      })
      if (res.ok) {
        toast.success('Email alert preferences saved successfully!')
      } else {
        toast.error('Failed to save email alert settings.')
      }
    } catch (e) {
      toast.error('Network error saving settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!token) return
    setIsSendingTest(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/user/email-alerts/send-test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Test email digest sent to ${user?.email || 'your inbox'}!`)
      } else {
        toast.error(data.detail || 'Failed to send test email.')
      }
    } catch (e) {
      toast.error('Error triggering test email digest.')
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-6xl mx-auto pb-28 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground block mb-2">Automated Market Intelligence</span>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            AI Email Alerts
          </h1>
          <p className="text-base text-muted-foreground font-semibold mt-2">
            Configure automated market digests and trading signals delivered directly to your inbox.
          </p>
        </div>

        <Button 
          onClick={handleSendTest}
          disabled={isSendingTest || watchlistSymbols.length === 0}
          className="rounded-2xl bg-primary hover:opacity-90 text-primary-foreground font-black px-6 h-12 cursor-pointer shadow-lg text-sm shrink-0"
        >
          {isSendingTest ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Send Test Email Now
        </Button>
      </div>

      {/* Main Settings Card */}
      <Card className="rounded-[2.5rem] border border-border bg-card p-10 shadow-xl space-y-10">
        
        {/* User Email Destination Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-muted/40 border border-border rounded-3xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-foreground shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Alert Recipient Email</p>
              <p className="text-base font-black text-foreground mt-0.5">{user?.email || 'Your account email'}</p>
            </div>
          </div>
          <Badge className="bg-background text-foreground border-border text-xs font-black px-3.5 py-1.5 rounded-full w-fit">
            Verified Recipient
          </Badge>
        </div>

        {/* Frequency Options */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground block">
              Digest Schedule Frequency
            </label>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              Select how frequently automated watchlist market updates should be delivered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { id: '1h', label: 'Hourly Digest', sub: 'Every 1 Hour (Default)' },
              { id: '2h', label: 'Every 2 Hours', sub: 'Bi-hourly updates' },
              { id: '4h', label: 'Every 4 Hours', sub: 'Midday updates' },
              { id: 'daily', label: 'Market Open', sub: 'Daily morning summary' },
              { id: 'off', label: 'Disabled', sub: 'Pause all emails' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFrequency(item.id as any)}
                className={cn(
                  "p-5 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[120px]",
                  frequency === item.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-xl scale-[1.02] font-black" 
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-border font-bold"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <Clock className="w-5 h-5" />
                  {frequency === item.id && <Check className="w-5 h-5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-sm font-black block text-inherit">{item.label}</span>
                  <span className="text-xs opacity-80 font-semibold block mt-0.5">{item.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-6 pt-8 border-t border-border/60">
          <div className="flex items-center justify-between p-6 bg-muted/40 border border-border rounded-3xl gap-6">
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-foreground" /> Intraday Trading Signal Focus
              </p>
              <p className="text-xs text-muted-foreground font-semibold">
                Include breaking catalysts, momentum sentiment, intraday price targets, and stop-loss recommendations.
              </p>
            </div>
            <Switch 
              checked={intradayFocus}
              onCheckedChange={setIntradayFocus}
              className="scale-125"
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-muted/40 border border-border rounded-3xl gap-6">
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-foreground" /> Enable Email Dispatch
              </p>
              <p className="text-xs text-muted-foreground font-semibold">
                Master switch to enable or pause all automated email digest dispatches.
              </p>
            </div>
            <Switch 
              checked={enabled}
              onCheckedChange={setEnabled}
              className="scale-125"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="rounded-2xl bg-primary hover:opacity-90 text-primary-foreground font-black px-10 h-14 text-sm cursor-pointer shadow-xl"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2 stroke-[3]" />}
            Save Preferences
          </Button>
        </div>

      </Card>

      {/* Tracked Watchlist Stocks */}
      <Card className="rounded-[2.5rem] border border-border bg-card p-10 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-base font-black text-foreground flex items-center gap-2.5">
            <List className="w-5 h-5 text-foreground" /> Watchlist Equities Tracked in Digest ({watchlistSymbols.length})
          </h3>
          <Badge variant="outline" className="border-border text-muted-foreground font-extrabold text-xs px-3 py-1 rounded-full">
            Active Watchlist
          </Badge>
        </div>

        {watchlistSymbols.length === 0 ? (
          <div className="p-8 bg-muted/40 border border-border rounded-3xl text-center space-y-2">
            <p className="text-sm font-bold text-foreground">No stocks in your watchlist yet</p>
            <p className="text-xs text-muted-foreground font-semibold max-w-md mx-auto">
              Add equities to your watchlist on the Watchlist page. Your automated digests will analyze news and signals for those stocks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {watchlistSymbols.map(sym => (
              <div key={sym} className="p-4 bg-muted/40 border border-border rounded-2xl text-center">
                <span className="font-black text-sm text-foreground block">{sym}</span>
                <span className="text-[10px] font-bold text-muted-foreground block mt-1 uppercase">Tracked</span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
