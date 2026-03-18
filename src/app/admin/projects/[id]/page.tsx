import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import AdminProjectTabs from '@/components/admin/AdminProjectTabs'

export default async function AdminProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, client:profiles(full_name, email, phone)')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const [phasesRes, selectionsRes, documentsRes, announcementsRes] = await Promise.all([
    supabase.from('project_phases').select('*, tasks(*)').eq('project_id', params.id).order('sort_order'),
    supabase.from('selections').select('*').eq('project_id', params.id).order('sort_order'),
    supabase.from('documents').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('announcements').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1">
          ← All Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-muted-foreground">{project.address}</p>
          </div>
          <Link
            href={`/admin/projects/${params.id}/edit`}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Edit Project
          </Link>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: `${project.progress_percent}%` }} />
            </div>
            <span className="text-sm font-semibold text-brand">{project.progress_percent}%</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Client</p>
          <p className="text-sm font-medium">{(project.client as any)?.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{(project.client as any)?.email}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Est. Completion</p>
          <p className="text-sm font-semibold">{formatDate(project.estimated_completion)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Contract Value</p>
          <p className="text-sm font-semibold">{formatCurrency(project.contract_value)}</p>
        </div>
      </div>

      {/* Tabbed content — client component */}
      <AdminProjectTabs
        project={project}
        phases={phasesRes.data ?? []}
        selections={selectionsRes.data ?? []}
        documents={documentsRes.data ?? []}
        announcements={announcementsRes.data ?? []}
      />
    </div>
  )
}
