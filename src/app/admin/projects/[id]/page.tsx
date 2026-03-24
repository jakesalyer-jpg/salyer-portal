import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import AdminProjectTabs from '@/components/admin/AdminProjectTabs'

export default async function AdminProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: project } = await supabase.from('projects').select('*').eq('id', params.id).single()
  if (!project) notFound()

  const [phasesRes, selectionsRes, documentsRes, todosRes, logsRes, messagesRes, teamRes, subsRes] = await Promise.all([
    supabase.from('project_phases').select('*, tasks(*)').eq('project_id', params.id).order('sort_order'),
    supabase.from('selections').select('*').eq('project_id', params.id).order('sort_order'),
    supabase.from('documents').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('todos').select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('daily_logs').select('*').eq('project_id', params.id).order('log_date', { ascending: false }),
    supabase.from('messages').select('*').eq('project_id', params.id).order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'admin'),
    supabase.from('subcontractors').select('id, name, trade').order('trade'),
  ])

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>← All Projects</Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p style={{ fontSize: '13px', color: '#6a5f50' }}>{project.address}</p>
          </div>
          <Link href={`/admin/projects/${params.id}/edit`} style={{ padding: '6px 14px', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', fontSize: '11px', color: '#b8976a', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>Edit</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Progress', value: `${project.progress_percent}%` },
          { label: 'Est. Completion', value: formatDate(project.estimated_completion) },
          { label: 'Start Date', value: formatDate(project.start_date) },
          { label: 'Contract Value', value: formatCurrency(project.contract_value) },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...card, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,151,106,0.4), transparent)' }} />
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6a5f50', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#b8976a' }}>{value}</p>
          </div>
        ))}
      </div>

      <AdminProjectTabs
        project={project}
        phases={phasesRes.data ?? []}
        selections={selectionsRes.data ?? []}
        documents={documentsRes.data ?? []}
        todos={todosRes.data ?? []}
        dailyLogs={logsRes.data ?? []}
        messages={messagesRes.data ?? []}
        team={teamRes.data ?? []}
        subcontractors={subsRes.data ?? []}
      />
    </div>
  )
}