import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { CurrencyProvider } from '../context/CurrencyContext'
import { AuthProvider, useAuth } from '../context/AuthContext'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.add('dark');root.setAttribute('data-theme','dark');root.style.colorScheme='dark';}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Equinox — Real-time Market Intelligence',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

import React from 'react'
import { useNavigate } from '@tanstack/react-router'

function AuthGuard({ children, isAuthPage }: { children: React.ReactNode, isAuthPage: boolean }) {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!loading && isAuthenticated && user && !user.onboarded && !isAuthPage) {
      navigate({ to: '/onboarding', replace: true })
    }
  }, [loading, isAuthenticated, user, isAuthPage, navigate])

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  // Conditionally hide Header and Footer on login, signup, OTP verify, reset, and onboarding pages
  const isAuthPage = [
    '/login', 
    '/signup', 
    '/verify-signup', 
    '/forgot-password', 
    '/reset-password', 
    '/onboarding'
  ].includes(location.pathname)

  const isDashboardPage = location.pathname.startsWith('/dashboard')
  const hideLayout = isAuthPage || isDashboardPage

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere]">
        <AuthProvider>
          <AuthGuard isAuthPage={isAuthPage}>
            <CurrencyProvider>
              {!hideLayout && <Header />}
              {children}
              {!hideLayout && <Footer />}
            </CurrencyProvider>
          </AuthGuard>
        </AuthProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
