import { createClient } from '@/lib/supabase/server'
import AdminMessagesClient from '@/components/admin/AdminMessagesClient'

export default async function AdminMessagesPage() {
  const supabase = createClient()
  const { data: projects } = await supabase.from('projects').select('id, name, address, client:profiles(full_name, email)').order('created_at', { ascending: false })
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <AdminMessagesClient projects={projects ?? []} profile={profile} />
    </div>
  )
}