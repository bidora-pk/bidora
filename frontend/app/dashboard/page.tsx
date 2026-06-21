'use client'
import { useState, useEffect } from 'react'
import TenderCard from '@/components/TenderCard'
import ChatBot from '@/components/ChatBot'
import { Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Tender {
  tender_id: string;
  title: string;
  industry_category: string;
  procuring_agency: string;
  procurement_type: string;
  time_left: string;
  address: string;
  quantity: string;
  description: string;
  view_link: string;
  document_iframe_link: string;
  direct_pdf_link: string;
}

export default function DashboardPage() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  
  // User profile state for the ChatBot context
  const [userNiches, setUserNiches] = useState<string[]>([])
  const [companyName, setCompanyName] = useState('Guest User')

  const supabase = createClient()

  useEffect(() => {
    fetchTenders()
    loadUserProfile()
  }, [category])

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', user.id).single()
    const { data: niches } = await supabase.from('user_niches').select('category').eq('user_id', user.id)

    if (profile?.company_name) setCompanyName(profile.company_name)
    if (niches) setUserNiches(niches.map(n => n.category))
  }

  async function fetchTenders(searchQuery = search) {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders?category=${category}&search=${searchQuery}`)
      const data = await res.json()
      setTenders(data.tenders || [])
    } catch (error) {
      console.error("Failed to fetch tenders:", error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 pb-20">
      {/* Top Navigation Bar */}
      <header className="bg-[#111827] border-b border-[#1e2d45] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">B</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Bidora Intelligence</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search tenders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTenders()}
                className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button 
              onClick={() => fetchTenders()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Category Filters */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
          {['All', 'IT & Tech', 'Electrical & Power', 'Construction & Civil Works', 'Medical & Health', 'Professional Services'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                category === cat 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                  : 'bg-[#111827] border-[#1e2d45] text-slate-400 hover:border-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tender Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
            <p>Loading active tenders from EPADS...</p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-[#1e2d45] rounded-2xl">
            <p className="text-slate-400">No tenders found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenders.map(tender => (
              <TenderCard key={tender.tender_id} tender={tender} />
            ))}
          </div>
        )}
      </main>

      {/* Persistent AI Chatbot */}
      <ChatBot userNiches={userNiches} companyName={companyName} />
    </div>
  )
}
