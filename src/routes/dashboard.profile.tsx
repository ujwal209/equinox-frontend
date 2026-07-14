import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, ShieldCheck, Activity, DollarSign, Settings, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/dashboard/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <main className="page-wrap min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
              <User className="h-8 w-8 text-muted-foreground" />
              Account Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal details and trading preferences.
            </p>
          </div>
          {user.is_verified && (
            <Badge variant="secondary" className="w-fit text-xs px-3 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Verified Member
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Identity Card */}
          <div className="md:col-span-5 space-y-6">
            <Card className="rounded-2xl shadow-sm border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl uppercase">
                    {user.email.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-primary truncate max-w-[200px]">{user.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> User Email
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Member since {joinDate}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-primary">Account Settings</h3>
                    <p className="text-xs text-muted-foreground">Update password and security</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-semibold">
                    <Settings className="h-3.5 w-3.5 mr-1.5" /> Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Preferences */}
          <div className="md:col-span-7">
            <Card className="rounded-2xl shadow-sm border bg-card h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Trading Profile
                </CardTitle>
                <Link to="/onboarding" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Edit <Settings className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {user.onboarding ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">Experience Level</p>
                      <p className="font-bold text-primary">{user.onboarding.experience_years}</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">Risk Tolerance</p>
                      <Badge variant="outline" className="font-bold">
                        {user.onboarding.risk_tolerance}
                      </Badge>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground">Preferred Asset Classes</p>
                      <div className="flex flex-wrap gap-2">
                        {user.onboarding.preferred_assets.map(asset => (
                          <Badge key={asset} variant="secondary" className="text-xs px-3 py-1 font-semibold rounded-lg bg-primary/5 text-primary border-primary/10">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> Allocated Budget
                      </p>
                      <p className="text-2xl font-black text-primary">${user.onboarding.trading_budget.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground opacity-50" />
                    <div>
                      <p className="text-sm font-bold text-primary">No Trading Profile Found</p>
                      <p className="text-xs text-muted-foreground mt-1">Complete onboarding to unlock personalized insights.</p>
                    </div>
                    <Button asChild className="rounded-xl mt-2 font-bold text-xs h-9">
                      <Link to="/onboarding">Start Onboarding</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </main>
  )
}
