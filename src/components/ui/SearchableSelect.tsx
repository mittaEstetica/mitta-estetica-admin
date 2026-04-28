import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  subtitle?: string
}

interface Props {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  emptyLabel,
  required,
  disabled,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase().includes(q)),
    )
  }, [options, query])

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {required && <input tabIndex={-1} className="sr-only" value={value} required onChange={() => {}} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-all ${
          open
            ? 'border-brand-gold ring-2 ring-brand-gold/10'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white'}`}
      >
        <span className={selected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !required && (
            <span
              role="button"
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {emptyLabel && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  !value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {emptyLabel}
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400">Nenhum resultado encontrado</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    opt.value === value
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.subtitle && (
                    <span className="block text-xs text-gray-400">{opt.subtitle}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
