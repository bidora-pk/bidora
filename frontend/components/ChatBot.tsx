'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatBot({ userNiches, companyName }: { userNiches: string[]; companyName: string }) {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your EPADS tender assistant. I can help you find tenders matching your niche (${userNiches.join(', ') || 'set your niche in profile'}), explain procurement types, or answer questions about specific tenders. What are you looking for?` }
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, userNiches, companyName })
      })
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-blue-600 to-blue-800
                   shadow-lg shadow-blue-900/50 flex items-center justify-center
                   hover:scale-105 transition-transform"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px]
                        bg-[#111827] border border-[#1e2d45] rounded-2xl shadow-2xl
                        flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2d45]
                          bg-gradient-to-r from-blue-900/40 to-transparent">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">EPADS Assistant</p>
              <p className="text-[11px] text-slate-400">Powered by Gemini • Free tier</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                  ${m.role === 'user' ? 'bg-slate-700' : 'bg-blue-600'}`}>
                  {m.role === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
                </div>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-[#1a2236] text-slate-200 rounded-tl-sm border border-[#1e2d45]'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-[#1a2236] border border-[#1e2d45] px-3 py-2 rounded-2xl rounded-tl-sm">
                  <Loader2 size={14} className="text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-2 flex-wrap">
              {['Show IT tenders', 'What closes today?', 'Best tenders for my niche'].map(s => (
                <button key={s} onClick={() => { setInput(s); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-[#1e2d45]
                             text-slate-400 hover:text-slate-200 hover:border-blue-500/40 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex gap-2 bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about tenders..."
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}