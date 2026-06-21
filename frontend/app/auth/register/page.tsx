'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  async function handleRegister() {
    if (!fullName || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')

    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: 'https://bidorapk.vercel.app/auth/dashboard', }
    })

    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-2xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Check your email</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          We sent a confirmation link to <strong className="text-slate-200">{email}</strong>.
          Click it to activate your BIDORA account.
        </p>
        <Link href="/auth/login" className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Back to sign in →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700
                        flex items-center justify-center shadow-lg shadow-blue-900/40">
          <span className="text-white font-black text-base tracking-tighter">B</span>
        </div>
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
          BIDORA
        </span>
      </Link>

      <div className="w-full max-w-sm bg-[#111827] border border-[#1e2d45] rounded-2xl p-8">
        <h1 className="text-xl font-bold text-slate-100 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Start winning tenders with BIDORA — free</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-4 py-2.5
                         text-sm text-slate-200 placeholder-slate-600 outline-none
                         focus:border-blue-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-4 py-2.5
                         text-sm text-slate-200 placeholder-slate-600 outline-none
                         focus:border-blue-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-4 py-2.5 pr-10
                           text-sm text-slate-200 placeholder-slate-600 outline-none
                           focus:border-blue-500/60 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors
                     text-white font-semibold text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create free account'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-700">
        © {new Date().getFullYear()} BIDORA ·{' '}
        <a href="mailto:bidorapk@gmail.com" className="hover:text-slate-500 transition-colors">bidorapk@gmail.com</a>
      </p>
    </div>
  )
}