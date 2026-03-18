import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, PROJECT_STATUS_LABELS } from '@/lib/utils'
import type { Project } from '@/types'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'

export default async function AdminDashboard() {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  const allProjects = (projects ?? []) as Project[]

  const active = allProjects.filter((p) => p.status === 'active').length
  const preCon = allProjects.filter((p) => p.status === 'pre_construction').length
  const completed = allProjects.filter((p) => p.status === 'completed').length
  const totalValue = allProjects.reduce((sum, p) => sum + (p.contract_value ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage every active build from one place.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Builds', value: active, color: 'text-blue-600' },
          { label: 'Pre-Construction', value: preCon, color: 'text-amber-600' },
          { label: 'Completed', value: completed, color: 'text-brand' },
          { label: 'Total Portfolio', value: formatCurrency(totalValue), color: 'text-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-secondary/50">
          <h2 className="text-sm font-semibold">Projects</h2>
        </div>
        {allProjects.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No projects yet.{' '}
            <Link href="/admin/projects/new" className="text-brand hover:underline">Create your first project →</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allProjects.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  {p.client && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Client: {(p.client as any).full_name ?? (p.client as any).email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6 ml-4 flex-shrink-0 text-right">
                  <div className="hidden md:block">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${p.progress_percent}%` }} />
                      </div>
                      <span className="text-xs font-medium">{p.progress_percent}%</span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-muted-foreground">Est. Completion</p>
                    <p className="text-xs font-medium mt-0.5">{formatDate(p.estimated_completion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-xs font-medium mt-0.5">{formatCurrency(p.contract_value)}</p>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
