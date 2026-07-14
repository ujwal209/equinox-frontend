import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth, API_BASE_URL } from '../context/AuthContext'
import { Sparkles, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { isAuthenticated, loading, token, refreshUser, user } = useAuth()
  const navigate = useNavigate()

  const [experience, setExperience] = useState('Beginner')
  const [riskTolerance, setRiskTolerance] = useState('Medium')
  const [preferredAssets, setPreferredAssets] = useState<string[]>(['Equities'])
  const [budget, setBudget] = useState('5000')
  
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Redirect logic: protect route and prevent repeating onboarding
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate({ to: '/login' })
      } else if (user && user.onboarded) {
        navigate({ to: '/dashboard' })
      }
    }
  }, [isAuthenticated, loading, user, navigate])

  const handleAssetToggle = (asset: string) => {
    setPreferredAssets((prev) => {
      if (prev.includes(asset)) {
        return prev.filter((a) => a !== asset)
      } else {
        return [...prev, asset]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    const budgetNum = parseFloat(budget)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setErr('Please enter a valid trading budget greater than zero.')
      return
    }

    if (preferredAssets.length === 0) {
      setErr('Please select at least one preferred asset class.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          experience_years: experience,
          risk_tolerance: riskTolerance,
          preferred_assets: preferredAssets,
          trading_budget: budgetNum
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Reload user profile in context and navigate to home
        await refreshUser()
        navigate({ to: '/dashboard' })
      } else {
        setErr(data.detail || 'Failed to submit onboarding profile. Please try again.')
      }
    } catch (error) {
      console.error('[Equinox UI Onboarding error]', error)
      setErr('Connection error. Please check that your FastAPI backend is running.')
    } finally {
      setSubmitting(false)
    }
  }
  const handleSkip = async () => {
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/onboarding/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      })
      if (res.ok) {
        await refreshUser()
        navigate({ to: '/dashboard' })
      } else {
        const data = await res.json()
        setErr(data.detail || 'Failed to skip onboarding.')
      }
    } catch (error) {
      console.error('[Equinox UI Onboarding error]', error)
      setErr('Connection error. Please check that your FastAPI backend is running.')
    } finally {
      setSubmitting(false)
    }
  }


  if (loading || !isAuthenticated || (user && user.onboarded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Spinner className="h-6 w-6 text-[var(--sea-ink)]" />
      </div>
    )
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-base)] text-[var(--sea-ink)]">
      
      {/* Left side: Branding / Info */}
      <div className="hidden lg:flex flex-col items-center justify-center border-r border-[var(--line)] bg-[var(--surface-strong)] p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--sea-ink)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--sea-ink)]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="z-10 text-center space-y-6 max-w-md">
          <Badge variant="outline" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink-soft)] h-auto mb-4 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--sea-ink)]" />
            <span className="font-extrabold uppercase tracking-widest text-[var(--sea-ink)] text-xs">
              Welcome to Equinox
            </span>
          </Badge>
          <h1 className="text-5xl font-black text-[var(--sea-ink)] tracking-tighter leading-tight">
            Configure Your<br/>Trading Profile
          </h1>
          <p className="text-sm text-[var(--sea-ink-soft)] font-medium leading-relaxed px-4">
            Customize target price metrics based on your market risk parameters. We'll use these settings to tailor simulated alerts and analytics strictly to your investment style.
          </p>
        </div>
      </div>

      {/* Right side: Onboarding Form */}
      <div className="flex items-center justify-center p-4 sm:p-8 h-screen overflow-y-auto no-scrollbar relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden absolute top-8 left-0 right-0 flex flex-col items-center justify-center space-y-2 px-4">
          <Badge variant="outline" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-[10px] text-[var(--sea-ink-soft)]">
            <Sparkles className="h-3 w-3 text-[var(--sea-ink)]" />
            <span className="font-extrabold uppercase tracking-widest text-[var(--sea-ink)]">
              Trading Onboarding
            </span>
          </Badge>
          <h1 className="text-2xl font-black text-[var(--sea-ink)] tracking-tight">Set Up Your Profile</h1>
        </div>

        <div className="w-full max-w-md space-y-6 mt-20 lg:mt-0">
          <Card className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] lg:bg-transparent lg:border-none lg:shadow-none p-6 sm:p-8 shadow-sm backdrop-blur-md text-left space-y-6">
            
            {err && (
              <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-3.5 text-xs text-red-400 font-medium animate-in slide-in-from-top-2">
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Experience level */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                  Trading Experience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Expert'].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setExperience(exp)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                        experience === exp
                          ? 'border-[var(--sea-ink)] bg-[var(--sea-ink)] text-[var(--bg-base)] shadow-md'
                          : 'border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:border-[var(--sea-ink)]/50 hover:bg-[var(--line)]/50'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                  Risk Tolerance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setRiskTolerance(risk)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                        riskTolerance === risk
                          ? 'border-[var(--sea-ink)] bg-[var(--sea-ink)] text-[var(--bg-base)] shadow-md'
                          : 'border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:border-[var(--sea-ink)]/50 hover:bg-[var(--line)]/50'
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred asset classes */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                  Preferred Asset Classes
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Equities', 'Crypto', 'Options', 'Forex'].map((asset) => {
                    const isChecked = preferredAssets.includes(asset)
                    return (
                      <button
                        key={asset}
                        type="button"
                        onClick={() => handleAssetToggle(asset)}
                        className={`py-3 px-4 text-xs font-bold rounded-xl border transition cursor-pointer text-left flex items-center justify-between ${
                          isChecked
                            ? 'border-[var(--sea-ink)] bg-[var(--sea-ink)] text-[var(--bg-base)] shadow-md'
                            : 'border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:border-[var(--sea-ink)]/50 hover:bg-[var(--line)]/50'
                        }`}
                      >
                        <span>{asset}</span>
                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                          isChecked ? 'border-[var(--bg-base)] bg-[var(--bg-base)]' : 'border-[var(--line)]'
                        }`}>
                          {isChecked && <ShieldCheck className="h-3 w-3 text-[var(--sea-ink)] fill-current" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                  Investment Budget (USD equivalent)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-10 pr-4 py-3 h-12 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] focus-visible:border-[var(--sea-ink)] focus-visible:ring-1 focus-visible:ring-[var(--sea-ink)] font-bold text-sm shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={handleSkip}
                  className="w-full sm:w-1/3 rounded-xl border border-[var(--line)] bg-transparent text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:border-[var(--sea-ink)] hover:bg-[var(--chip-bg)] font-bold text-xs py-3.5 h-12 transition shadow-sm"
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-2/3 rounded-xl bg-[var(--sea-ink)] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] text-[var(--bg-base)] font-extrabold text-xs py-3.5 h-12 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border-none shadow-md"
                >
                  {submitting ? (
                    <Spinner className="h-4 w-4 text-[var(--bg-base)]" />
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </main>
  )
}
