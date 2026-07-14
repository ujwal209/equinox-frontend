import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Mail, MapPin, Clock, Send, CheckCircle2, Globe, ShieldAlert 
} from 'lucide-react'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setSubmitted(true)
  }

  return (
    <main className="w-full min-h-screen bg-[var(--bg-base)] text-left py-12 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header Block */}
        <div className="space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border-zinc-800 text-zinc-400">
            Contact Desk
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            Get in Touch with our Operations.
          </h1>
          <p className="text-base text-muted-foreground font-semibold leading-relaxed max-w-3xl">
            Have questions about quantitative data integration, API licensing, or security guidelines? Drop us a line and our infrastructure team will respond.
          </p>
        </div>

        {/* Contact Info Cards */}
        <section className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <Mail className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Electronic Mail</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-3">
              Direct inquiries and support tickets:
            </p>
            <a href="mailto:ops@equinox.tech" className="text-xs font-black text-white hover:underline uppercase tracking-wider block">
              ops@equinox.tech
            </a>
          </Card>
          
          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <MapPin className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Operations Hub</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-3">
              Equinox Technologies Inc.
            </p>
            <span className="text-xs text-muted-foreground font-semibold block leading-relaxed">
              7th Floor, Tech Park Tower A,<br />
              Whitefield, Bangalore 560066
            </span>
          </Card>

          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <Clock className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Operational Hours</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-3">
              Operations support window:
            </p>
            <span className="text-xs text-muted-foreground font-semibold block leading-relaxed">
              Monday – Friday<br />
              09:00 – 18:00 (IST)
            </span>
          </Card>
        </section>

        {/* Contact Form Container */}
        <section className="grid gap-8 grid-cols-1 lg:grid-cols-3 bg-muted/5 border border-border rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-md relative overflow-hidden">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Send a Message</h2>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Fill out the secure communication form, and our system will register it inside our team triage dashboard.
              </p>
            </div>
            
            <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-2xl flex items-start gap-3 text-zinc-400">
              <ShieldAlert className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold leading-relaxed">
                All communications are encrypted end-to-end. We will never share your email address or personal credentials.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {submitted ? (
              <div className="p-8 border border-emerald-500/20 bg-emerald-950/20 rounded-2xl flex items-center gap-4 text-emerald-400 h-full min-h-[300px]">
                <CheckCircle2 className="h-8 w-8 shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Message Registered</h4>
                  <p className="text-xs font-semibold mt-1">Thank you. An operations representative will reach out shortly to resolve your query.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Name</label>
                    <Input
                      required
                      type="text"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-xl border-border bg-background text-xs h-10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <Input
                      required
                      type="email"
                      placeholder="jane@doe.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="rounded-xl border-border bg-background text-xs h-10 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                  <Input
                    required
                    type="text"
                    placeholder="API Integration Inquiries"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="rounded-xl border-border bg-background text-xs h-10 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message Body</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe your inquiry in detail..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background text-xs font-bold text-white p-3 focus:outline-none focus:ring-1 focus:ring-zinc-650 transition-all leading-relaxed"
                  />
                </div>

                <Button type="submit" className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white border-0 font-black text-xs uppercase px-6 tracking-wider flex items-center gap-2 cursor-pointer">
                  Send Message <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
