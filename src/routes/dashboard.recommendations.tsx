import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/recommendations')({
  component: RecommendationsRedirectPage,
})

function RecommendationsRedirectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to email alerts
    navigate({ to: '/dashboard/email-alerts' })
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      <Card className="rounded-[2.5rem] border border-border bg-muted/10 p-10 max-w-md shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-foreground">Recommendations Replaced</h2>
        <p className="text-sm text-muted-foreground font-semibold mt-2">
          The recommendations section has been upgraded to automated **Intraday AI Watchlist Email Alerts**.
        </p>
        <Button 
          onClick={() => navigate({ to: '/dashboard/email-alerts' })}
          className="mt-6 rounded-xl bg-white text-black font-black hover:bg-zinc-200 px-6 h-11 cursor-pointer"
        >
          Go to AI Email Alerts <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  )
}
