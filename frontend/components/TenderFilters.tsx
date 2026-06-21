'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface Filters {
  category: string
  proc_type: string
  urgency: string
  search: string
}

const CATEGORIES = [
  'All',
  'IT & Tech',
  'Electrical & Power',
  'Construction & Civil Works',
  'Vehicles & Transport',
  'Medical & Health',
  'Office & General Supplies',
  'Professional Services',
  'Industrial & Hardware',
  'Food & Catering',
  'Uncategorized',
]

const PROC_TYPES = [
  'All',
  'Goods',
  'Works',
  'Services',
  'Consulting',
]

const URGENCY_OPTIONS = [
  { value: 'All',    label: 'Any deadline' },
  { value: '24h',    label: 'Closing in 24h' },
  { value: '3days',  label: 'Closing in 3 days' },
  { value: '7days',  label: 'Closing in 7 days' },
]

export default function TenderFilters({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const [searchInput, setSearchInput] = useState(filters.search)

  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    update('search', searchInput)
  }

  function clearSearch() {
    setSearchInput('')
    update('search', '')
  }

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.proc_type !== 'All' ||
    filters.urgency !== 'All' ||
    filters.search !== ''

  function clearAll() {
    setSearchInput('')
    onChange({ category: 'All', proc_type: 'All', urgency: 'All', search: '' })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search tenders…"
          className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl pl-8 pr-8 py-2
                     text-sm text-slate-200 placeholder-slate-600 outline-none
                     focus:border-blue-500/60 transition-colors"
        />
        {searchInput && (
          <button type="button" onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={13} />
          </button>
        )}
      </form>

      {/* Category */}
      <select
        value={filters.category}
        onChange={e => update('category', e.target.value)}
        className="bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm
                   text-slate-300 outline-none focus:border-blue-500/60 transition-colors
                   cursor-pointer"
      >
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
        ))}
      </select>

      {/* Procurement type */}
      <select
        value={filters.proc_type}
        onChange={e => update('proc_type', e.target.value)}
        className="bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm
                   text-slate-300 outline-none focus:border-blue-500/60 transition-colors
                   cursor-pointer"
      >
        {PROC_TYPES.map(t => (
          <option key={t} value={t}>{t === 'All' ? 'All types' : t}</option>
        ))}
      </select>

      {/* Urgency */}
      <select
        value={filters.urgency}
        onChange={e => update('urgency', e.target.value)}
        className="bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm
                   text-slate-300 outline-none focus:border-blue-500/60 transition-colors
                   cursor-pointer"
      >
        {URGENCY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                     text-slate-400 hover:text-slate-200 border border-[#1e2d45]
                     hover:border-slate-600 transition-colors">
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}