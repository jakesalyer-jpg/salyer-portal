import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Verify the caller is an admin
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, full_name, phone } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Use service role key to invite user
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name, phone, role: 'client' },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) return NextResponse.json({ error: error.message, code: error.status, details: JSON.stringify(error) }, { status: 400 })

  // Update profile with name/phone if provided
  if (full_name || phone) {
    await adminClient
      .from('profiles')
      .update({ full_name, phone })
      .eq('id', data.user.id)
  }

  return NextResponse.json({ success: true })
}
