'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NicheSelector from '@/components/NicheSelector'
import { Save, Building2, User, Phone, MapPin } from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState({ full_name: '', company_name: '', company_type: '', city: '', phone: '' })
  const [niches, setNiches]   = useState<string[]>([])
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: n }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_niches').select('category').eq('user_id', user.id)
      ])
      if (p) setProfile(p)
      if (n) setNiches(n.map((r: any) => r.category))
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').upsert({ id: user.id, ...profile })

    // Sync niches: delete all then insert current
    await supabase.from('user_niches').delete().eq('user_id', user.id)
    if (niches.length) {
      await supabase.from('user_niches').insert(niches.map(c => ({ user_id: user.id, category: c })))
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Company Profile</h1>
        <p className="text-slate-400 mt-1 text-sm">Set your details and niche to receive personalised alerts</p>
      </div>

      {/* Profile fields */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2"><User size={16}/> Personal & Company</h2>
        {[
          { key: 'full_name',     label: 'Full Name',      icon: User,      placeholder: 'Your name' },
          { key: 'company_name',  label: 'Company Name',   icon: Building2, placeholder: 'Your company' },
          { key: 'company_type',  label: 'Company Type',   icon: Building2, placeholder: 'Contractor / Supplier / Consultant...' },
          { key: 'city',          label: 'City',           icon: MapPin,    placeholder: 'Lahore' },
          { key: 'phone',         label: 'Phone',          icon: Phone,     placeholder: '+92 300 000 0000' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
            <input
              value={(profile as any)[key]}
              onChange={e => setProfile({ ...profile, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-4 py-2.5
                         text-sm text-slate-200 placeholder-slate-600 outline-none
                         focus:border-blue-500/60 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Niche selector */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-1">Your Industry Niches</h2>
        <p className="text-xs text-slate-500 mb-4">Select all that apply — you'll only see tenders in these categories and receive alerts for them</p>
        <NicheSelector selected={niches} onChange={setNiches} />
        {niches.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">{niches.length} niche{niches.length > 1 ? 's' : ''} selected</p>
        )}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                   bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors
                   text-white font-semibold text-sm">
        <Save size={16} />
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile & Niches'}
      </button>
    </div>
  )
}