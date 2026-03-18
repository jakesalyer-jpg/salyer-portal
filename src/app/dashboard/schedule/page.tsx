import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScheduleCalendar from '@/components/client/ScheduleCalendar'

export default async function SchedulePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

const projectQuery = isAdmin
    ? supabase.from('projects').select('id, name, address').order('created_at', { ascending: false }).limit(1).single()
    : supabase.from('projects').select('id, name, address').eq('client_id', user.id).single()

  const { data: project } = await projectQuery

  if (!project && !isAdmin) {
    return <div className="p-8 text-sm" style={{ color: '#6a5f50' }}>No project found.</div>
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, phase:project_phases(name, status)')
    .eq('project_id', project?.id ?? '')
    .order('due_date', { ascending: true })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>
          Project Schedule
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6a5f50' }}>{project?.address}</p>
      </div>
      <ScheduleCalendar tasks={tasks ?? []} isAdmin={isAdmin} projectId={project?.id ?? ''} />
    </div>
  )
}
