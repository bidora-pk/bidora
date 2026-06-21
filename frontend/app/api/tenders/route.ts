import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  // Use service-role-free anon client — tenders table has public read RLS policy
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const procType = searchParams.get('proc_type')
  const urgency  = searchParams.get('urgency')
  const search   = searchParams.get('search')
  const page     = parseInt(searchParams.get('page') || '1')
  const pageSize = 20
  const offset   = (page - 1) * pageSize

  let query = supabase
    .from('tenders')
    .select('*', { count: 'exact' })
    .eq('tracker_status', 'Active')
    .order('calculated_ending_date', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (category && category !== 'All')  query = query.eq('industry_category', category)
  if (procType && procType !== 'All')  query = query.ilike('procurement_type', `${procType}%`)
  if (search)                          query = query.ilike('title', `%${search}%`)

  if (urgency === '24h')   query = query.lte('calculated_ending_date', new Date(Date.now() + 86_400_000).toISOString())
  if (urgency === '3days') query = query.lte('calculated_ending_date', new Date(Date.now() + 259_200_000).toISOString())
  if (urgency === '7days') query = query.lte('calculated_ending_date', new Date(Date.now() + 604_800_000).toISOString())

  const { data, error, count } = await query

  if (error) {
    console.error('Tenders API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tenders: data ?? [], total: count ?? 0, page, pageSize })
}