import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { Card } from '@/components/ui/card'
import { Loader2, Globe2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/indices')({
  component: IndicesPage,
})

interface Asset {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  history: number[]
}

function IndicesPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const { convert } = useCurrency()
  const [indices, setIndices] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/market/live`)
        if (res.ok) {
          const data = await res.json()
          // Filter out indices (usually they start with ^)
          const indexData = data.filter((a: any) => a.symbol.startsWith('^'))
          setIndices(indexData)
        }
      } catch (err) {
        console.error('Indices load error', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const t = setInterval(loadData, 15000)
    return () => clearInterval(t)
  }, [])

  if (authLoading || (isAuthenticated && user && !user.onboarded)) {
    return (
      <div className="page-wrap py-24 text-center">
        <Loader2 className="h-8 w-8 text-[var(--sea-ink)] animate-spin inline-block" />
      </div>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--sea-ink)] tracking-tight flex items-center gap-3">
            <Globe2 className="h-8 w-8" />
            Global Indices
          </h1>
          <p className="text-[var(--sea-ink-soft)] mt-2">
            Macro-level market health trackers and major financial indices.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-8 w-8 text-[var(--sea-ink)] animate-spin" />
          <p className="text-sm font-bold text-[var(--sea-ink-soft)]">Compiling Indices Data...</p>
        </div>
      ) : indices.length === 0 ? (
        <div className="text-center py-24">
          <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-500">No indices data available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indices.map((idx, i) => (
            <Card key={i} className="rounded-[2rem] p-6 border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col justify-between hover:border-[var(--sea-ink)] transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-extrabold text-[var(--sea-ink)] text-xl tracking-tight">
                    {idx.symbol}
                  </h3>
                  <p className="text-[var(--sea-ink-soft)] text-xs font-semibold mt-1 max-w-[150px] truncate">
                    {idx.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-[var(--sea-ink)]">
                    {convert(idx.price).formatted}
                  </p>
                  <p className={`text-xs font-bold mt-1 ${idx.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="h-20 w-full rounded-xl bg-[var(--chip-bg)] border border-[var(--chip-line)] overflow-hidden flex items-end">
                {/* Micro Sparkline representation */}
                <div className="w-full flex items-end h-full p-2 gap-[1px]">
                   {idx.history && idx.history.length > 0 ? (() => {
                     const min = Math.min(...idx.history)
                     const max = Math.max(...idx.history)
                     const range = max - min || 1
                     return idx.history.map((val, hIdx) => (
                       <div 
                         key={hIdx} 
                         className={`w-full rounded-sm ${idx.change >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`} 
                         style={{ height: `${Math.max(10, ((val - min) / range) * 100)}%` }} 
                       />
                     ))
                   })() : <div className="text-center w-full text-[10px] text-[var(--sea-ink-soft)]">No History</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
