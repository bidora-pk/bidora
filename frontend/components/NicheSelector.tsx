'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'

const ALL_CATEGORIES = [
  { id: 'IT & Tech',                  icon: '💻', desc: 'Software, hardware, networks, servers' },
  { id: 'Electrical & Power',         icon: '⚡', desc: 'Transformers, cables, solar, generators' },
  { id: 'Construction & Civil Works', icon: '🏗️', desc: 'Roads, buildings, bridges, renovation' },
  { id: 'Vehicles & Transport',       icon: '🚗', desc: 'Cars, trucks, ambulances, machinery' },
  { id: 'Medical & Health',           icon: '🏥', desc: 'Medicines, surgical, hospital equipment' },
  { id: 'Office & General Supplies',  icon: '🗂️', desc: 'Stationery, furniture, printing' },
  { id: 'Professional Services',      icon: '📋', desc: 'Consultancy, audit, training, security' },
  { id: 'Industrial & Hardware',      icon: '🔧', desc: 'Steel, pipes, pumps, spare parts' },
  { id: 'Food & Catering',            icon: '🍽️', desc: 'Rations, catering, canteen supplies' },
]

export default function NicheSelector({
  selected, onChange
}: {
  selected: string[];
  onChange: (cats: string[]) => void;
}) {
  function toggle(cat: string) {
    onChange(
      selected.includes(cat)
        ? selected.filter(c => c !== cat)
        : [...selected, cat]
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ALL_CATEGORIES.map(cat => {
        const active = selected.includes(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all
              ${active
                ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/10'
                : 'border-[#1e2d45] bg-[#111827] hover:border-slate-600'}`}
          >
            <span className="text-2xl flex-shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${active ? 'text-blue-300' : 'text-slate-200'}`}>
                {cat.id}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cat.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5
              ${active ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
              {active && <Check size={12} className="text-white" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}