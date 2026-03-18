import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { ProjectPhase } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'

export default async function SchedulePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', user.id)
    .single()

  if (!project) return <div className="p-8 text-muted-foreground">No project found.</div>

  const { data: phases } = await supabase
    .from('project_phases')
    .select('*, tasks(*)')
    .eq('project_id', project.id)
    .order('sort_order')

  const allPhases = (phases ?? []) as ProjectPhase[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Project Schedule</h1>
        <p className="text-sm text-muted-foreground mt-1">{project.address}</p>
      </div>

      <div className="space-y-4">
        {allPhases.length === 0 && (
          <p className="text-sm text-muted-foreground">No schedule added yet. Check back soon.</p>
        )}
        {allPhases.map((phase) => (
          <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <StatusBadge status={phase.status} />
                <h2 className="text-sm font-semibold">{phase.name}</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(phase.start_date)} — {formatDate(phase.end_date)}
              </span>
            </div>
            {phase.tasks && phase.tasks.length > 0 ? (
              <div className="divide-y divide-border">
                {(phase.tasks ?? [])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((task) => (
                    <div key={task.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
                          task.is_completed
                            ? 'bg-brand border-brand'
                            : 'border-border bg-background'
                        }`}>
                          {task.is_completed && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {task.completed_date ? `Completed ${formatDate(task.completed_date)}` : formatDate(task.due_date)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="px-5 py-3 text-sm text-muted-foreground">No tasks in this phase yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
