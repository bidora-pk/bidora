'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, XCircle } from 'lucide-react'

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.'
  return ''
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.'
  return ''
}

export default function LoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')
  const [touched,  setTouched]  = useState({ email: false, password: false })

  const errors = {
    email:    validateEmail(email),
    password: validatePassword(password),
  }

  function touch(field: keyof typeof touched) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  async function handleLogin() {
    setTouched({ email: true, password: true })
    if (errors.email || errors.password) return

    setLoading(true)
    setApiError('')

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setApiError('App configuration error — missing environment variables. Contact bidorapk@gmail.com.')
        setLoading(false)
        return
      }

      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(supabaseUrl, supabaseKey)

      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (err) {
        if (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials')) {
          setApiError('Incorrect email or password. Please try again.')
        } else if (err.message.includes('Email not confirmed')) {
          setApiError('Please confirm your email first — check your inbox for the verification link.')
        } else if (err.message.includes('rate limit') || err.status === 429) {
          setApiError('Too many attempts. Please wait a minute and try again.')
        } else {
          setApiError(err.message)
        }
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (e: any) {
      setApiError('Unexpected error: ' + (e?.message ?? 'please try again.'))
      setLoading(false)
    }
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
        <h1 className="text-xl font-bold text-slate-100 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to your BIDORA account</p>

        {apiError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20
                          text-red-400 text-sm flex items-start gap-2">
            <XCircle size={15} className="flex-shrink-0 mt-0.5" />
            {apiError}
          </div>
        )}

        <div className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="you@company.com"
              className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 text-sm
                          text-slate-200 placeholder-slate-600 outline-none transition-colors
                          ${touched.email && errors.email
                            ? 'border-red-500/60'
                            : 'border-[#1e2d45] focus:border-blue-500/60'}`}
            />
            {touched.email && errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Your password"
                className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 pr-10 text-sm
                            text-slate-200 placeholder-slate-600 outline-none transition-colors
                            ${touched.password && errors.password
                              ? 'border-red-500/60'
                              : 'border-[#1e2d45] focus:border-blue-500/60'}`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors
                     text-white font-semibold text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Create one free
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