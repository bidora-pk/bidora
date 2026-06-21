'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, Bookmark, User, LogOut } from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard',         label: 'Tender Feed',    icon: LayoutDashboard },
  { href: '/dashboard/saved',   label: 'Saved Tenders',  icon: Bookmark        },
  { href: '/dashboard/profile', label: 'Profile & Niches', icon: User          },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-60 flex-shrink-0 border-r border-[#1e2d45] flex flex-col bg-[#0b0f1a]">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e2d45]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700
                          flex items-center justify-center shadow-lg shadow-blue-900/40
                          group-hover:shadow-blue-600/50 transition-shadow">
            <span className="text-white font-black text-sm tracking-tighter">B</span>
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
            BIDORA
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#1e2d45]">
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}