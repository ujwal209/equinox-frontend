import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth, API_BASE_URL } from '../context/AuthContext'
import { ArrowRight, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Redirect to Dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (!email.trim() || !password.trim()) return

    if (password !== confirmPassword) {
      setErr('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      })

      const data = await res.json()

      if (res.ok) {
        // Redirect to OTP verification page
        navigate({
          to: '/verify-signup',
          search: { email: email.trim() }
        })
      } else {
        setErr(data.detail || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('[Equinox UI Signup Error]', error)
      setErr('Connection error. Please check that your FastAPI backend is running.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Spinner className="h-6 w-6 text-[var(--sea-ink)]" />
      </div>
    )
  }

  return (
    <main className="h-screen overflow-hidden grid lg:grid-cols-12 bg-[var(--bg-base)] text-[var(--sea-ink)]">
      {/* Left Column: SaaS Branding Hero */}
      <section className="hidden lg:flex lg:col-span-5 h-full relative flex-col justify-between p-12 border-r border-[var(--line)] bg-[radial-gradient(ellipse_at_top_right,rgba(128,128,128,0.05),transparent_60%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />
        
        {/* Top Logo */}
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3.5 py-1.5 text-xs text-[var(--sea-ink-soft)] no-underline shadow"
          >
<img src="/logo.png" alt="Equinox Core" className="h-10 w-auto object-contain invert dark:invert-0" />
          </Link>
        </div>

        {/* Center content banner */}
        <div className="relative z-10 space-y-6 my-auto text-left">
          <Badge variant="outline" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] bg-[var(--chip-bg)] border border-[var(--line)] px-3 py-1 rounded-full h-auto">
            <Sparkles className="h-3 w-3 text-[var(--sea-ink)]" />
            Join the surveillance network
          </Badge>
          <h2 className="text-4xl font-black tracking-tight leading-[1.08] text-[var(--sea-ink)]">
            Create your account to unlock dashboard limits.
          </h2>
          <p className="text-sm text-[var(--sea-ink-soft)] font-medium max-w-sm leading-relaxed">
            Register your trading credentials, complete the personalized onboarding, and receive real-time target metrics today.
          </p>
        </div>

        {/* Bottom review card */}
        <Card className="relative z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow backdrop-blur-md text-left flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-[var(--sea-ink)]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--sea-ink)]">Security-First Protocol</h4>
            <p className="text-[11px] text-[var(--sea-ink-soft)] mt-1 leading-normal">
              Fully encrypted password storage and reliable email OTP verification channels to protect user configurations globally.
            </p>
          </div>
        </Card>
      </section>

      {/* Right Column: Centered Form */}
      <section className="lg:col-span-7 h-full flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 relative overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md mx-auto space-y-8">
          
          {/* Logo for mobile view */}
          <div className="lg:hidden text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink-soft)] no-underline"
            >
<img src="/logo.png" alt="Equinox" className="h-8 w-auto object-contain invert dark:invert-0" />
            </Link>
          </div>

          <div className="text-left space-y-2">
            <h1 className="text-3xl font-black text-[var(--sea-ink)] tracking-tight">Create Account</h1>
            <p className="text-xs text-[var(--sea-ink-soft)] font-medium">Create your credentials to join Equinox</p>
          </div>

          {err && (
            <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-3.5 text-xs text-red-400 font-medium text-left">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--sea-ink)] hover:opacity-90 text-[var(--bg-base)] font-extrabold text-xs py-3.5 h-11 transition flex items-center justify-center gap-1.5 mt-6 cursor-pointer disabled:opacity-50 border-none"
            >
              {submitting ? (
                <Spinner className="h-4 w-4 text-[var(--bg-base)]" />
              ) : (
                <>
                  Register & Verify OTP
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          <div className="border-t border-[var(--line)] pt-4 text-center">
            <p className="text-[11px] text-[var(--sea-ink-soft)] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--sea-ink)] hover:underline no-underline font-bold">
                Log In
              </Link>
            </p>
          </div>

        </div>
      </section>
    </main>
  )
}
