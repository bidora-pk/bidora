'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowRight, Zap, Bell, Bot, Shield } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">

      {/* Navbar */}
      <nav className="border-b border-[#1e2d45] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        {/* BIDORA Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <span className="text-white font-black text-sm tracking-tighter">B</span>
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
            BIDORA
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Sign in
          </Link>
          <Link href="/auth/register"
            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
          <Zap size={12} />
          Pakistan Federal Procurement Intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
          Win More Tenders
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            With BIDORA
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Daily intelligence from EPADS — personalised to your niche, with AI-powered insights
          and automated alerts before deadlines hit.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500
                       text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/40">
            Start for free
            <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#1e2d45]
                       hover:border-slate-600 text-slate-300 font-semibold rounded-xl transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Zap,
            title: 'Daily Scraping',
            desc: 'Fresh tenders from EPADS every morning, automatically classified by industry.',
          },
          {
            icon: Bell,
            title: 'Smart Alerts',
            desc: 'Email alerts for new niche matches and deadline warnings for saved tenders.',
          },
          {
            icon: Bot,
            title: 'AI Assistant',
            desc: 'Ask anything about tenders — powered by Gemini, with live data as context.',
          },
          {
            icon: Shield,
            title: 'Niche Filtering',
            desc: 'See only what matters: your industries, your procurement categories.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title}
            className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center mb-4">
              <Icon size={16} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2d45] px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-white font-black text-xs">B</span>
          </div>
          <span className="font-black tracking-tight text-slate-300">BIDORA</span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} BIDORA · Tender Intelligence Platform ·{' '}
          <a href="mailto:bidorapk@gmail.com" className="hover:text-slate-400 transition-colors">
            bidorapk@gmail.com
          </a>
        </p>
      </footer>

    </div>
  )
}