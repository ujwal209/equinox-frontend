import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Briefcase, Compass, Shield, Users, MapPin, DollarSign, Calendar, ArrowRight, CheckCircle2 
} from 'lucide-react'

export const Route = createFileRoute('/careers')({
  component: CareersPage,
})

interface Position {
  id: string
  title: string
  team: string
  location: string
  salary: string
  type: string
  description: string
  requirements: string[]
}

function CareersPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Engineering', resume: '' })

  const positions: Position[] = [
    {
      id: 'quant-sys',
      title: 'Quantitative Systems Engineer',
      team: 'Infrastructure',
      location: 'Bangalore, India (Hybrid)',
      salary: '₹35L – ₹50L + Equity',
      type: 'Full-Time',
      description: 'Own and optimize our timeseries ingestion layer. Build high-frequency quotation aggregation systems connecting our web client directly to real-time order-book logs.',
      requirements: [
        '3+ years experience with high-throughput backend systems and microservices',
        'Extensive knowledge of memory caching, database aggregation pipelines, and real-time streaming protocols',
        'Familiarity with financial data structures and timeseries indexing (OHLCV, tick data)'
      ]
    },
    {
      id: 'senior-frontend',
      title: 'Senior Frontend Engineer (UI/UX)',
      team: 'Product',
      location: 'Remote (APAC)',
      salary: '$120k – $160k + Equity',
      type: 'Full-Time',
      description: 'Direct frontend design architectures. Craft high-performance data visualizations, responsive dark-mode screens, interactive heatmaps, and customizable charts.',
      requirements: [
        'Expertise in modern frontend frameworks, scalable architectures, and advanced UI/UX principles',
        'Strong portfolio of data-dense financial dashboards, interactive canvas charts, or trading terminals',
        'Obsession with micro-interactions, responsive grids, and clean layout code'
      ]
    },
    {
      id: 'data-infra',
      title: 'Market Data & ML Platform Engineer',
      team: 'Data Intelligence',
      location: 'Mumbai, India (On-site)',
      salary: '₹40L – ₹60L',
      type: 'Full-Time',
      description: 'Integrate deep learning and language models (advanced language models and data pipelines) to summarize financial news coverage and index real-time triggers for our AI Sentiment module.',
      requirements: [
        'Proven history designing RAG databases and handling LLM orchestration tools',
        'Experience building robust microservices that consume news feeds and produce structured sentiment scores',
        'Solid statistics background and understanding of market momentum indicators'
      ]
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) return
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
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-muted/40 border-border text-zinc-400">
            Careers at Equinox
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
            Build the Future of Financial Intelligence.
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl font-semibold leading-relaxed">
            We are a tight-knit squad of engineers, quants, and product thinkers redesigning the financial workspace. If you excel in high-throughput data pipes, responsive design, and low-latency APIs, let's talk.
          </p>
        </div>

        {/* Culture Stats */}
        <section className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <Users className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-2">High Autonomy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              We operate in micro-squads. You own your service end-to-end—from DB architecture to UI performance.
            </p>
          </Card>
          
          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <Shield className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-2">Open Infrastructure</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              We build open-source tools first. Contributing back to the tooling ecosystem is baked into our daily workflow.
            </p>
          </Card>

          <Card className="rounded-[2rem] p-8 border-border bg-muted/10">
            <Compass className="h-6 w-6 text-zinc-400 mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-2">Global Operations</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Our servers span Mumbai, Singapore, and Frankfurt. We support remote work across all APAC timezones.
            </p>
          </Card>
        </section>

        {/* Positions Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-foreground uppercase tracking-wider ml-1">Open Positions</h2>
          
          <div className="space-y-6">
            {positions.map((pos) => (
              <Card key={pos.id} className="rounded-[2rem] p-6 sm:p-8 border-border bg-muted/5 hover:bg-muted/10 hover:border-border transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/40 pb-6 mb-6">
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">{pos.title}</h3>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {pos.team}</span>
                      <span className="text-zinc-650">•</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pos.location}</span>
                      <span className="text-zinc-650">•</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {pos.salary}</span>
                    </div>
                  </div>
                  <Badge className="w-fit bg-muted/40 border border-border text-zinc-300 font-bold text-[10px] px-3.5 py-1 uppercase rounded-lg">
                    {pos.type}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">{pos.description}</p>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground block mb-1">Key Qualifications</span>
                    <ul className="space-y-2 pl-0 list-none text-xs text-muted-foreground font-semibold">
                      {pos.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* General Application Form */}
        <section className="bg-muted/5 border border-border rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-zinc-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="max-w-2xl">
            <h2 className="text-xl font-black text-foreground uppercase tracking-wider mb-2">Can't find a direct role?</h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-8">
              We are constantly seeking outstanding technical partners. Send over your resume, GitHub profile, or quantitative research documents, and we will get back to you.
            </p>

            {submitted ? (
              <div className="p-6 border border-emerald-500/20 bg-emerald-950/20 rounded-2xl flex items-center gap-4 text-emerald-400">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Application Received</h4>
                  <p className="text-xs font-semibold mt-1">Thanks for reaching out! Our operations desk will inspect your profile shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <Input
                      required
                      type="text"
                      placeholder="Alan Turing"
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
                      placeholder="alan@turing.org"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="rounded-xl border-border bg-background text-xs h-10 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Team</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border bg-background text-xs font-bold text-foreground px-3 focus:outline-none"
                  >
                    <option value="Engineering">Engineering (UI/Backend)</option>
                    <option value="Research">Quantitative Research</option>
                    <option value="Operations">Product Operations</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resume/Github URL</label>
                  <Input
                    required
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={form.resume}
                    onChange={(e) => setForm({ ...form, resume: e.target.value })}
                    className="rounded-xl border-border bg-background text-xs h-10 font-bold"
                  />
                </div>

                <Button type="submit" className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-foreground border-0 font-black text-xs uppercase px-6 tracking-wider flex items-center gap-2">
                  Submit Profile <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
