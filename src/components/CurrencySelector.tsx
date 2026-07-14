import React from 'react'
import { useCurrency, COUNTRIES } from '../context/CurrencyContext'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export default function CurrencySelector() {
  const { selectedCountry, setSelectedCountry } = useCurrency()

  const handleValueChange = (val: string) => {
    const matched = COUNTRIES.find((c) => c.code === val)
    if (matched) {
      setSelectedCountry(matched)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <Select value={selectedCountry.code} onValueChange={handleValueChange}>
        <SelectTrigger className="flex items-center gap-2 bg-[var(--chip-bg)] border border-[var(--line)] hover:border-[var(--sea-ink)] px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-semibold text-[var(--sea-ink)] h-auto select-none [&>svg]:text-[var(--sea-ink)]/50 border-none bg-transparent">
          <Globe className="h-3.5 w-3.5 text-[var(--sea-ink)]/70 animate-pulse mr-1" />
          <span>
            {selectedCountry.flag} {selectedCountry.currency} ({selectedCountry.symbol})
          </span>
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-[0_12px_36px_rgba(0,0,0,0.9)] max-h-60 overflow-y-auto">
          {COUNTRIES.map((c) => (
            <SelectItem
              key={c.code}
              value={c.code}
              className="text-xs font-semibold py-2 px-3 hover:bg-[var(--link-bg-hover)] text-[var(--sea-ink-soft)] focus:text-[var(--sea-ink)] focus:bg-[var(--link-bg-hover)] data-[selected=true]:text-[var(--sea-ink)] data-[selected=true]:bg-[var(--link-bg-hover)] transition cursor-pointer flex justify-between gap-4"
            >
              <span>
                {c.flag} {c.country}
              </span>
              <span className="opacity-60 ml-auto text-[10px]">
                {c.currency} ({c.symbol})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

