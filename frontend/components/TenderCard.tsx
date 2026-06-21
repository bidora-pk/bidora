'use client'
import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, FileText, Clock, Building2 } from 'lucide-react'

interface Tender {
  tender_id: string
  title: string
  industry_category: string
  procuring_agency: string
  procurement_type: string
  time_left: string
  address: string
  quantity: string
  description: string
  view_link: string
  document_iframe_link: string
  direct_pdf_link: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'IT & Tech':                  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Electrical & Power':         'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Construction & Civil Works': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Vehicles & Transport':       'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Medical & Health':           'bg-red-500/10 text-red-400 border-red-500/20',
  'Office & General Supplies':  'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Professional Services':      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Industrial & Hardware':      'bg-green-500/10 text-green-400 border-green-500/20',
  'Food & Catering':            'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Uncategorized':              'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

function urgencyColor(timeLeft: string): string {
  const lower = timeLeft.toLowerCase()
  if (lower.includes('h') && !lower.includes('day'))
    return 'text-red-400 font-semibold'
  if (lower.includes('1 day') || lower.includes('2 day'))
    return 'text-amber-400 font-semibold'
  if (lower.includes('3 day') || lower.includes('4 day') || lower.includes('5 day') || lower.includes('6 day'))
    return 'text-blue-400'
  return 'text-emerald-400'
}

export default function TenderCard({ tender, initialSaved = false }: { tender: Tender; initialSaved?: boolean }) {
  const [saved, setSaved]     = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggleSave() {
    setLoading(true)
    const method = saved ? 'DELETE' : 'POST'
    await fetch(`/api/tenders/${tender.tender_id}/save`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify({ notes: '' }) : undefined
    })
    setSaved(!saved)
    setLoading(false)
  }

  const catColor = CATEGORY_COLORS[tender.industry_category] || CATEGORY_COLORS['Uncategorized']
  const hasPdf   = tender.direct_pdf_link && tender.direct_pdf_link !== 'N/A'
  const hasDocs  = tender.document_iframe_link && tender.document_iframe_link !== 'N/A'

  return (
    <div className="group relative bg-[#111827] border border-[#1e2d45] rounded-2xl p-5
                    hover:border-blue-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${catColor}`}>
              {tender.industry_category}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{tender.tender_id}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
            {tender.title}
          </h3>
        </div>
        <button
          onClick={toggleSave}
          disabled={loading}
          className="flex-shrink-0 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          title={saved ? 'Remove from saved' : 'Save tender'}
        >
          {saved
            ? <BookmarkCheck size={18} className="text-blue-400" />
            : <Bookmark size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          }
        </button>
      </div>

      {/* Meta row */}
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Building2 size={12} className="text-slate-500 flex-shrink-0" />
          <span className="truncate">{tender.procuring_agency}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-slate-500 flex-shrink-0" />
            <span className={urgencyColor(tender.time_left)}>{tender.time_left}</span>
          </div>
          {tender.quantity && tender.quantity !== 'N/A' && (
            <span className="text-xs text-slate-500">Qty: {tender.quantity}</span>
          )}
        </div>
        {tender.address && tender.address !== 'N/A' && (
          <p className="text-[11px] text-slate-500 truncate">📍 {tender.address}</p>
        )}
      </div>

      {/* Description */}
      {tender.description && tender.description !== 'N/A' &&
        tender.description !== 'Embedded Bidding Document (See Link)' && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {tender.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={tender.view_link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500
                     text-white text-xs font-medium rounded-lg transition-colors"
        >
          <ExternalLink size={12} /> View Tender
        </a>
        {hasDocs && (
          <a
            href={tender.document_iframe_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#1e4a7f]
                       text-blue-300 text-xs font-medium rounded-lg border border-blue-900/50 transition-colors"
          >
            <FileText size={12} /> Bidding Docs
          </a>
        )}
        {hasPdf && (
          <a
            href={tender.direct_pdf_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50
                       text-emerald-400 text-xs font-medium rounded-lg border border-emerald-900/50 transition-colors"
          >
            <FileText size={12} /> PDF
          </a>
        )}
      </div>
    </div>
  )
}