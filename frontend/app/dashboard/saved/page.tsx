'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TenderCard from '@/components/TenderCard'
import { LayoutDashboard, Bookmark, User, LogOut, Loader2 } from 'lucide-react'

export default function SavedTendersPage() {
  const router = useRouter()

  const [tenders,  setTenders]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function load() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(supabaseUrl, supabaseKey)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }

        // Join saved_tenders → tenders in one query
        const { data, error: err } = await supabase
          .from('saved_tenders')
          .select('saved_at, notes, tenders(*)')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })

        if (err) { setError(err.message); setLoading(false); return }

        // Flatten: each row has a nested tenders object
        const flat = (data ?? [])
          .map((row: any) => row.tenders)
          .filter(Boolean)

        setTenders(flat)
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load saved tenders.')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex">

      {/* Sidebar */}
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
                       text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors">
            <LayoutDashboard size={16} />
            Tender Feed
          </Link>
          <Link href="/dashboard/saved"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       bg-blue-600/20 text-blue-300 text-sm font-medium">
            <Bookmark size={16} />
            Saved Tenders
          </Link>
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors">
            <User size={16} />
            Profile & Niches
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-[#1e2d45]">
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-[#1e2d45] px-6 py-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-100">Saved Tenders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${tenders.length} bookmarked tender${tenders.length !== 1 ? 's' : ''}`}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={22} className="animate-spin text-slate-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-red-400 text-sm mb-1">Failed to load saved tenders</p>
              <p className="text-slate-600 text-xs">{error}</p>
            </div>
          ) : tenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1e2d45]
                              flex items-center justify-center mb-4">
                <Bookmark size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">No saved tenders yet</p>
              <p className="text-slate-600 text-sm mb-4">
                Bookmark tenders from the feed to track them here.
              </p>
              <Link href="/dashboard"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm
                           font-medium rounded-xl transition-colors">
                Browse Tenders
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {tenders.map(t => (
                <TenderCard key={t.tender_id} tender={t} initialSaved={true} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}