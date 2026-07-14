import React, { createContext, useState, useContext, useEffect } from 'react'

export interface CountryCurrency {
  code: string
  country: string
  currency: string
  symbol: string
  rate: number
  flag: string
}

export const COUNTRIES: CountryCurrency[] = [
  { code: 'US', country: 'United States', currency: 'USD', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  { code: 'GB', country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 0.78, flag: '🇬🇧' },
  { code: 'EU', country: 'European Union', currency: 'EUR', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'IN', country: 'India', currency: 'INR', symbol: '₹', rate: 83.5, flag: '🇮🇳' },
  { code: 'JP', country: 'Japan', currency: 'JPY', symbol: '¥', rate: 156.4, flag: '🇯🇵' },
  { code: 'CA', country: 'Canada', currency: 'CAD', symbol: 'C$', rate: 1.36, flag: '🇨🇦' },
]

interface CurrencyContextType {
  selectedCountry: CountryCurrency
  setSelectedCountry: (country: CountryCurrency) => void
  convert: (amountInUSD: number) => { formatted: string; raw: number }
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<CountryCurrency>(COUNTRIES[3])

  useEffect(() => {
    const saved = localStorage.getItem('equinox_country')
    if (saved) {
      const found = COUNTRIES.find(c => c.code === saved)
      if (found) setSelectedCountryState(found)
    }
  }, [])

  const setSelectedCountry = (country: CountryCurrency) => {
    setSelectedCountryState(country)
    localStorage.setItem('equinox_country', country.code)
  }

  const convert = (amountInUSD: number) => {
    const raw = Number((amountInUSD * selectedCountry.rate).toFixed(2))
    const formatted = `${selectedCountry.symbol}${raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return { formatted, raw }
  }

  return (
    <CurrencyContext.Provider value={{ selectedCountry, setSelectedCountry, convert }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
