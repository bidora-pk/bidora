'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TenderCard from '@/components/TenderCard'
import TenderFilters from '@/components/TenderFilters'
import ChatBot from '@/components/ChatBot'
import {
  LayoutDashboard, Bookmark, User, LogOut,
  RefreshCw, ChevronLeft, ChevronRight, Bell, TrendingUp, Loader2
} from 'lucide-react'

interface Filters {
  category: string
  proc_type: string
  urgency: string
  search: string
}

const PAGE_SIZE = 20

export default function DashboardPage() {
  const router = useRouter()

  const [supabase,   setSupabase]   = useState<any>(null)
  const [user,       setUser]       = useState<any>(null)
  const [profile,    setProfile]    = useState<any>(null)
  const [niches,     setNiches]     = useState<string[]>([])
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set())

  const [tenders,    setTenders]    = useState<any[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [initDone,   setInitDone]   = useState(false)
  const [error,      setError]      = useState('')

  const [filters, setFilters] = useState<Filters>({
    category: 'All', proc_type: 'All', urgency: 'All', search: ''
  })

  // ── Init Supabase + auth ────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { createBrowserClient } = await import('@supabase/ssr')
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      setSupabase(sb)

      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      // Load profile, niches, saved IDs in parallel
      const [{ data: p }, { data: n }, { data: s }] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('user_niches').select('category').eq('user_id', user.id),
        sb.from('saved_tenders').select('tender_id').eq('user_id', user.id),
      ])
      if (p) setProfile(p)
      if (n) setNiches(n.map((r: any) => r.category))
      if (s) setSavedIds(new Set(s.map((r: any) => r.tender_id)))

      setInitDone(true)
    }
    init()
  }, [])

  // ── Fetch tenders ───────────────────────────────────────────────────────────
  const fetchTenders = useCallback(async (sb: any, pg: number, f: Filters) => {
    if (!sb) return
    setLoading(true)
    setError('')

    try {
      const offset = (pg - 1) * PAGE_SIZE
      let query = sb
        .from('tenders')
        .select('*', { count: 'exact' })
        .eq('tracker_status', 'Active')
        .order('calculated_ending_date', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (f.category !== 'All') query = query.eq('industry_category', f.category)
      if (f.proc_type !== 'All') query = query.ilike('procurement_type', `${f.proc_type}%`)
      if (f.search)              query = query.ilike('title', `%${f.search}%`)

      const now = Date.now()
      if (f.urgency === '24h')   query = query.lte('calculated_ending_date', new Date(now + 86_400_000).toISOString())
      if (f.urgency === '3days') query = query.lte('calculated_ending_date', new Date(now + 259_200_000).toISOString())
      if (f.urgency === '7days') query = query.lte('calculated_ending_date', new Date(now + 604_800_000).toISOString())

      const { data, error: err, count } = await query

      if (err) { setError(err.message); setLoading(false); return }
      setTenders(data ?? [])
      setTotal(count ?? 0)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tenders.')
    }
    setLoading(false)
  }, [])

  // Re-fetch when supabase ready, page or filters change
  useEffect(() => {
    if (initDone && supabase) fetchTenders(supabase, page, filters)
  }, [initDone, supabase, page, filters])

  const totalPages   = Math.ceil(total / PAGE_SIZE)
  const displayName  = profile?.full_name || profile?.company_name || user?.email?.split('@')[0] || 'User'

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-r border-[#1e2d45] flex flex-col">
        <div className="px-5 py-5 border-b border-[#1e2d45]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700
                            flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-white font-black text-sm tracking-tighter">B</span>
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
              BIDORA
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       bg-blue-600/20 text-blue-300 text-sm font-medium">
            <LayoutDashboard size={16} /> Tender Feed
          </Link>
          <Link href="/dashboard/saved"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors">
            <Bookmark size={16} /> Saved Tenders
          </Link>
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors">
            <User size={16} /> Profile & Niches
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-[#1e2d45]">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-700/50 flex items-center justify-center
                            text-xs font-bold text-blue-300 uppercase flex-shrink-0">
              {displayName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{displayName}</p>
              {niches.length > 0 && (
                <p className="text-[10px] text-slate-500">{niches.length} niche{niches.length > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="border-b border-[#1e2d45] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-100">Tender Feed</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {!initDone ? 'Loading…' : total > 0
                ? <>{total.toLocaleString()} active tenders{niches.length > 0 && <span className="ml-1.5 text-blue-400">· filtered by your niches</span>}</>
                : 'No tenders found'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {initDone && niches.length === 0 && (
              <Link href="/dashboard/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           text-amber-400 bg-amber-400/10 border border-amber-400/20
                           rounded-lg hover:bg-amber-400/20 transition-colors">
                <Bell size={12} /> Set your niches
              </Link>
            )}
            <button
              onClick={() => fetchTenders(supabase, page, filters)}
              disabled={!initDone || loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5
                         transition-colors disabled:opacity-40"
              title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Active niches strip */}
        {niches.length > 0 && (
          <div className="border-b border-[#1e2d45] px-6 py-3 flex items-center gap-3 flex-shrink-0 overflow-x-auto">
            <TrendingUp size={13} className="text-slate-500 flex-shrink-0" />
            {niches.map(n => (
              <span key={n}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap
                           bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {n}
              </span>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="border-b border-[#1e2d45] px-6 py-3 flex-shrink-0">
          <TenderFilters
            filters={filters}
            onChange={f => { setFilters(f); setPage(1) }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Error loading tenders: {error}
            </div>
          )}

          {/* Loading skeletons */}
          {(loading || !initDone) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 animate-pulse">
                  <div className="h-3 bg-[#1e2d45] rounded w-1/3 mb-3" />
                  <div className="h-4 bg-[#1e2d45] rounded w-5/6 mb-2" />
                  <div className="h-4 bg-[#1e2d45] rounded w-2/3 mb-4" />
                  <div className="h-3 bg-[#1e2d45] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1e2d45]
                              flex items-center justify-center mb-4">
                <LayoutDashboard size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">No tenders found</p>
              <p className="text-slate-600 text-sm">
                {Object.values(filters).some(v => v !== 'All' && v !== '')
                  ? 'Try adjusting your filters.'
                  : 'The pipeline hasn\'t run yet or no active tenders exist.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {tenders.map(t => (
                  <TenderCard key={t.tender_id} tender={t} initialSaved={savedIds.has(t.tender_id)} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl border border-[#1e2d45] text-slate-400
                               hover:text-slate-200 hover:border-slate-600
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-slate-400">
                    Page <span className="text-slate-200 font-medium">{page}</span> of{' '}
                    <span className="text-slate-200 font-medium">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl border border-[#1e2d45] text-slate-400
                               hover:text-slate-200 hover:border-slate-600
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Chatbot */}
      <ChatBot userNiches={niches} companyName={profile?.company_name || ''} />
    </div>
  )
}