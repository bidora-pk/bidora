'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'

// ── Validation helpers ────────────────────────────────────────────────────────

function validateName(v: string) {
  if (!v.trim()) return 'Full name is required.'
  if (v.trim().length < 2) return 'Name must be at least 2 characters.'
  if (v.trim().length > 80) return 'Name is too long.'
  return ''
}

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.'
  return ''
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.'
  if (v.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.'
  if (!/[0-9]/.test(v)) return 'Include at least one number.'
  return ''
}

function validateConfirm(pw: string, confirm: string) {
  if (!confirm) return 'Please confirm your password.'
  if (pw !== confirm) return 'Passwords do not match.'
  return ''
}

// ── Password strength ─────────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)   score++
  if (pw.length >= 12)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair',   color: 'bg-amber-400' }
  if (score === 4) return { score, label: 'Good',  color: 'bg-blue-400' }
  return              { score, label: 'Strong',     color: 'bg-emerald-400' }
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, error, touched, children,
}: {
  label: string; error: string; touched: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
      {touched && error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <XCircle size={11} /> {error}
        </p>
      )}
      {touched && !error && (
        <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircle2 size={11} /> Looks good
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [showCf,    setShowCf]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState('')
  const [success,   setSuccess]   = useState(false)

  // touched state — only show errors after the user has left a field
  const [touched, setTouched] = useState({
    fullName: false, email: false, password: false, confirm: false,
  })

  const errors = {
    fullName: validateName(fullName),
    email:    validateEmail(email),
    password: validatePassword(password),
    confirm:  validateConfirm(password, confirm),
  }

  const allValid = !errors.fullName && !errors.email && !errors.password && !errors.confirm

  const strength = passwordStrength(password)

  function touch(field: keyof typeof touched) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  async function handleRegister() {
    // Touch all fields to show any remaining errors
    setTouched({ fullName: true, email: true, password: true, confirm: true })
    if (!allValid) return

    setLoading(true)
    setApiError('')

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setApiError('App configuration error — missing Supabase environment variables. Contact bidorapk@gmail.com.')
        setLoading(false)
        return
      }

      // Dynamic import avoids SSR issues and catches init errors clearly
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(supabaseUrl, supabaseKey)

      const { error: err } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/dashboard`, }
      })

      if (err) {
        // Translate common Supabase error messages to user-friendly ones
        if (err.message.includes('already registered') || err.message.includes('already been registered')) {
          setApiError('An account with this email already exists. Try signing in instead.')
        } else if (err.message.includes('Invalid URL') || err.message.includes('invalid path')) {
          setApiError('App configuration error — invalid Supabase URL. Contact bidorapk@gmail.com.')
        } else if (err.message.includes('rate limit') || err.status === 429) {
          setApiError('Too many attempts. Please wait a minute and try again.')
        } else {
          setApiError(err.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (e: any) {
      setApiError('Unexpected error: ' + (e?.message ?? 'please try again.'))
    }

    setLoading(false)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30
                        flex items-center justify-center mb-5 text-3xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Check your email</h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          We sent a confirmation link to{' '}
          <strong className="text-slate-200">{email.trim().toLowerCase()}</strong>.
          Click it to activate your BIDORA account.
        </p>
        <p className="text-slate-600 text-xs mt-3 max-w-xs">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button onClick={() => setSuccess(false)}
            className="text-blue-400 hover:text-blue-300 transition-colors underline">
            try again
          </button>.
        </p>
        <Link href="/auth/login"
          className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Back to sign in →
        </Link>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
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

        {/* API-level error */}
        {apiError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20
                          text-red-400 text-sm flex items-start gap-2">
            <XCircle size={15} className="flex-shrink-0 mt-0.5" />
            {apiError}
          </div>
        )}

        <div className="space-y-4">

          {/* Full name */}
          <Field label="Full Name" error={errors.fullName} touched={touched.fullName}>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onBlur={() => touch('fullName')}
              placeholder="Your full name"
              className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 text-sm
                          text-slate-200 placeholder-slate-600 outline-none transition-colors
                          ${touched.fullName && errors.fullName
                            ? 'border-red-500/60'
                            : touched.fullName && !errors.fullName
                            ? 'border-emerald-500/50'
                            : 'border-[#1e2d45] focus:border-blue-500/60'}`}
            />
          </Field>

          {/* Email */}
          <Field label="Email" error={errors.email} touched={touched.email}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="you@company.com"
              className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 text-sm
                          text-slate-200 placeholder-slate-600 outline-none transition-colors
                          ${touched.email && errors.email
                            ? 'border-red-500/60'
                            : touched.email && !errors.email
                            ? 'border-emerald-500/50'
                            : 'border-[#1e2d45] focus:border-blue-500/60'}`}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password} touched={touched.password}>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 pr-10 text-sm
                            text-slate-200 placeholder-slate-600 outline-none transition-colors
                            ${touched.password && errors.password
                              ? 'border-red-500/60'
                              : touched.password && !errors.password
                              ? 'border-emerald-500/50'
                              : 'border-[#1e2d45] focus:border-blue-500/60'}`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300
                        ${i <= strength.score ? strength.color : 'bg-[#1e2d45]'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Password strength: <span className={`font-medium ${
                    strength.label === 'Weak'   ? 'text-red-400'    :
                    strength.label === 'Fair'   ? 'text-amber-400'  :
                    strength.label === 'Good'   ? 'text-blue-400'   : 'text-emerald-400'
                  }`}>{strength.label}</span>
                </p>
              </div>
            )}
          </Field>

          {/* Confirm password */}
          <Field label="Confirm Password" error={errors.confirm} touched={touched.confirm}>
            <div className="relative">
              <input
                type={showCf ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => touch('confirm')}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder="Re-enter your password"
                className={`w-full bg-[#1a2236] border rounded-xl px-4 py-2.5 pr-10 text-sm
                            text-slate-200 placeholder-slate-600 outline-none transition-colors
                            ${touched.confirm && errors.confirm
                              ? 'border-red-500/60'
                              : touched.confirm && !errors.confirm
                              ? 'border-emerald-500/50'
                              : 'border-[#1e2d45] focus:border-blue-500/60'}`}
              />
              <button type="button" onClick={() => setShowCf(!showCf)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors
                     text-white font-semibold text-sm">
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
            : 'Create free account'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-700">
        © {new Date().getFullYear()} BIDORA ·{' '}
        <a href="mailto:bidorapk@gmail.com" className="hover:text-slate-500 transition-colors">
          bidorapk@gmail.com
        </a>
      </p>
    </div>
  )
}