import { createClient } from '@/lib/supabase/server'
import TodosClient from '@/components/admin/TodosClient'

export default async function TodosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: todos } = await supabase.from('todos').select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)').order('created_at', { ascending: false })
  const { data: projects } = await supabase.from('projects').select('id, name').order('name')
  const { data: team } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'admin')
  const { data: subcontractors } = await supabase.from('subcontractors').select('id, name, trade').order('trade')

  return (
    <div style={{ height: '100%' }}>
      <TodosClient todos={todos ?? []} projects={projects ?? []} team={team ?? []} profile={profile} subcontractors={subcontractors ?? []} />
    </div>
  )
}