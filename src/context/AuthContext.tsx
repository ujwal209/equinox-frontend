import React, { createContext, useContext, useState, useEffect } from 'react'

export interface UserOnboarding {
  experience_years: string
  risk_tolerance: string
  preferred_assets: string[]
  trading_budget: number
  onboarded: boolean
}

export interface UserProfile {
  id: string
  email: string
  is_verified: bool
  onboarded: bool
  onboarding: UserOnboarding | null
  created_at: string
}

interface AuthContextType {
  isAuthenticated: boolean
  loading: boolean
  user: UserProfile | null
  token: string | null
  login: (token: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for stored token on mount
  useEffect(() => {
    async function initializeAuth() {
      const storedToken = localStorage.getItem('equinox_token')
      if (storedToken) {
        setToken(storedToken)
        await fetchUserProfile(storedToken)
      } else {
        setLoading(false)
      }
    }
    initializeAuth()
  }, [])

  // Helper to fetch user profile details using session token
  async function fetchUserProfile(jwtToken: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })

      if (res.ok) {
        const profile = await res.json()
        setUser(profile)
      } else {
        // Clear token if invalid/expired
        console.warn('[Equinox Auth] Session token is invalid or expired. Logging out.')
        handleLogout()
      }
    } catch (err) {
      console.error('[Equinox Auth] Error loading user profile:', err)
      handleLogout()
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (jwtToken: string): Promise<boolean> => {
    setLoading(true)
    localStorage.setItem('equinox_token', jwtToken)
    setToken(jwtToken)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
      if (res.ok) {
        const profile = await res.json()
        setUser(profile)
        setLoading(false)
        return true
      }
    } catch (err) {
      console.error('[Equinox Auth] Failed to fetch profile details after login:', err)
    }
    handleLogout()
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('equinox_token')
    setToken(null)
    setUser(null)
    setLoading(false)
  }

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token)
    }
  }

  const value: AuthContextType = {
    isAuthenticated: !!token && !!user,
    loading,
    user,
    token,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
