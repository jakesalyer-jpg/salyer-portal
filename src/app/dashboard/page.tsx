import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, daysUntil, urgencyColor, urgencyLabel, formatCurrency } from '@/lib/utils'
import type { Project, ProjectPhase, Selection, Announcement, Milestone } from '@/types'
import ProgressRing from '@/components/client/ProgressRing'
import StatusBadge from '@/components/shared/StatusBadge'
import UrgencyBadge from '@/components/shared/UrgencyBadge'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Admin sees all projects; client sees only theirs
  const isAdmin = profile?.role === 'admin'

  let projectsQuery = supabase
    .from('projects')
    .select('*, client:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    projectsQuery = projectsQuery.eq('client_id', user.id)
  }

  const { data: projects } = await projectsQuery

  // For clients: load detail data for their project
  const project = projects?.[0] as Project | undefined

  if (!isAdmin && !project) {
    return (
      <div className="p-8 flex items-center justify-center min-h-full">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No project found</p>
          <p className="text-sm text-muted-foreground">Contact your builder to get set up.</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    redirect('/admin')
  }

  const [phasesRes, selectionsRes, announcementsRes, milestonesRes] = await Promise.all([
    supabase
      .from('project_phases')
      .select('*, tasks(*)')
      .eq('project_id', project!.id)
      .order('sort_order'),
    supabase
      .from('selections')
      .select('*')
      .eq('project_id', project!.id)
      .order('deadline', { ascending: true, nullsFirst: false }),
    supabase
      .from('announcements')
      .select('*')
      .eq('project_id', project!.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('milestones')
      .select('*')
      .eq('project_id', project!.id)
      .order('due_date'),
  ])

  const phases = (phasesRes.data ?? []) as ProjectPhase[]
  const selections = (selectionsRes.data ?? []) as Selection[]
  const announcements = (announcementsRes.data ?? []) as Announcement[]
  const milestones = (milestonesRes.data ?? []) as Milestone[]

  const pendingSelections = selections.filter((s) => s.status === 'pending')
  const upcomingDeadlines = selections
    .filter((s) => s.status === 'pending' && s.deadline)
    .slice(0, 5)

  const activePhase = phases.find((p) => p.status === 'active')
  const nextMilestone = milestones.find((m) => !m.is_completed)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {project!.address} · Est. completion {formatDate(project!.estimated_completion)}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Overall Progress</p>
          <div className="flex items-center gap-3">
            <ProgressRing percent={project!.progress_percent} />
            <span className="text-2xl font-semibold text-brand">{project!.progress_percent}%</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Current Phase</p>
          <p className="text-base font-semibold leading-tight">{activePhase?.name ?? '—'}</p>
          {activePhase?.end_date && (
            <p className="text-xs text-muted-foreground mt-1">Est. {formatDate(activePhase.end_date)}</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Next Milestone</p>
          <p className="text-base font-semibold leading-tight">{nextMilestone?.name ?? 'None'}</p>
          {nextMilestone?.due_date && (
            <p className="text-xs text-muted-foreground mt-1">{formatDate(nextMilestone.due_date)}</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pending Selections</p>
          <p className="text-2xl font-semibold text-blue-600">{pendingSelections.length}</p>
          {pendingSelections.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">action required</p>
          )}
        </div>
      </div>

      {/* Main two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Timeline */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Project Timeline</h2>
          {phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No phases added yet.</p>
          ) : (
            <div className="space-y-1">
              {phases.map((phase, i) => (
                <div key={phase.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                      phase.status === 'completed' ? 'bg-brand' :
                      phase.status === 'active' ? 'bg-blue-500 ring-2 ring-blue-200' :
                      'bg-muted border border-border'
                    }`} />
                    {i < phases.length - 1 && <div className="w-px flex-1 bg-border min-h-[20px] my-0.5" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${phase.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                        {phase.name}
                      </p>
                      <StatusBadge status={phase.status} />
                    </div>
                    {phase.end_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {phase.status === 'completed' ? 'Completed' : 'Est.'} {formatDate(phase.end_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Upcoming Selection Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
          ) : (
            <div className="divide-y divide-border">
              {upcomingDeadlines.map((sel) => {
                const days = daysUntil(sel.deadline)
                return (
                  <div key={sel.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{sel.item_name}</p>
                      <p className="text-xs text-muted-foreground">{sel.category} · Due {formatDate(sel.deadline)}</p>
                    </div>
                    <UrgencyBadge days={days} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Latest Updates</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="flex gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base flex-shrink-0">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.is_urgent && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex-shrink-0">Urgent</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
