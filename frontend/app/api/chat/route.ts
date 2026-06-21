import { createClient } from '@/lib/supabase'
import { askGemini } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { message, userNiches, companyName } = await req.json()
  const supabase = createClient()

  // Fetch relevant tenders from the user's niches to use as context
  let contextTenders: any[] = []
  if (userNiches?.length) {
    const { data } = await supabase
      .from('tenders')
      .select('tender_id, title, industry_category, procuring_agency, time_left, description, view_link')
      .eq('tracker_status', 'Active')
      .in('industry_category', userNiches)
      .order('calculated_ending_date', { ascending: true })
      .limit(15)
    contextTenders = data || []
  }

  // Also do a keyword search in case the message is about something specific
  if (message.length > 3) {
    const keywords = message.split(' ').filter((w: string) => w.length > 4).slice(0, 3)
    for (const kw of keywords) {
      const { data } = await supabase
        .from('tenders')
        .select('tender_id, title, industry_category, procuring_agency, time_left, description, view_link')
        .eq('tracker_status', 'Active')
        .ilike('title', `%${kw}%`)
        .limit(5)
      if (data) contextTenders.push(...data)
    }
  }

  // Deduplicate by tender_id
  const seen = new Set<string>()
  const unique = contextTenders.filter(t => { const k = !seen.has(t.tender_id); seen.add(t.tender_id); return k })

  const tenderContext = unique.map(t =>
    `[${t.tender_id}] ${t.title} | Agency: ${t.procuring_agency} | Category: ${t.industry_category} | Deadline: ${t.time_left} | Link: ${t.view_link}`
  ).join('\n')

  const reply = await askGemini(message, tenderContext, {
    company: companyName || 'Unknown',
    niches: userNiches || []
  })

  return NextResponse.json({ reply })
}