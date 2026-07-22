import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useAuth, API_BASE_URL } from '../context/AuthContext'
import { Mail, Key, Lock, Check, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const resetSearchSchema = z.object({
  email: z.string().catch(''),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search) => resetSearchSchema.parse(search),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { email } = Route.useSearch()
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  const [emailInput, setEmailInput] = useState(email || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
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
    setSuccessMsg(null)

    if (!emailInput.trim() || otp.length !== 6 || !newPassword.trim()) {
      setErr('Please enter all required fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErr('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setErr('New password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          otp: otp.trim(),
          new_password: newPassword.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMsg('Password updated successfully! Redirecting to Login...')
        setTimeout(() => {
          navigate({ to: '/login' })
        }, 2000)
      } else {
        setErr(data.detail || 'Incorrect or expired OTP password reset code.')
      }
    } catch (error) {
      console.error('[Equinox UI Reset Password Error]', error)
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
            Restore Session
          </Badge>
          <h2 className="text-4xl font-black tracking-tight leading-[1.08] text-[var(--sea-ink)]">
            Choose a secure, strong password.
          </h2>
          <p className="text-sm text-[var(--sea-ink-soft)] font-medium max-w-sm leading-relaxed">
            Ensure your password is at least 6 characters long and utilizes distinct symbols to secure your user configuration profile.
          </p>
        </div>

        {/* Bottom review card */}
        <Card className="relative z-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow backdrop-blur-md text-left flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-[var(--sea-ink)]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--sea-ink)]">Verification Status</h4>
            <p className="text-[11px] text-[var(--sea-ink-soft)] mt-1 leading-normal">
              Used codes are instantly invalidated from our memory pool on submission to guarantee transaction integrity.
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
            <h1 className="text-3xl font-black text-[var(--sea-ink)] tracking-tight">Choose Password</h1>
            <p className="text-xs text-[var(--sea-ink-soft)] font-medium">Verify your OTP code and select new credentials</p>
          </div>

          {err && (
            <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-3.5 text-xs text-red-400 font-medium text-left">
              {err}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl bg-green-950/20 border border-green-900/40 p-3.5 text-xs text-green-400 font-medium flex items-center gap-2 text-left">
              <Check className="h-4 w-4" />
              {successMsg}
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
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                6-Digit OTP Code
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0 transition tracking-widest font-mono text-center"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)] z-10" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] placeholder-zinc-500 focus-visible:border-[var(--sea-ink)] focus-visible:ring-0"
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
                'Save & Reset Password'
              )}
            </Button>
          </form>

          {/* Development Tips */}
          <div className="rounded-xl bg-muted/40/10 border border-[var(--line)] p-4 text-[10px] text-[var(--sea-ink-soft)] leading-relaxed text-left space-y-1">
            <span className="font-bold text-[var(--sea-ink)] block uppercase tracking-wider">Development Tip:</span>
            <p>If SMTP mail credentials are not configured in your backend `.env` variables, the 6-digit OTP code is logged directly to your **backend console/server logs**!</p>
          </div>

          <div className="border-t border-[var(--line)] pt-4 text-center">
            <p className="text-[11px] text-[var(--sea-ink-soft)] font-medium">
              Want to cancel?{' '}
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
