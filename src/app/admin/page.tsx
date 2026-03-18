import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
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

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>All Projects</h1>
          <p className="text-sm mt-1" style={{ color: '#6a5f50' }}>Manage every active build from one place.</p>
        </div>
        <Link href="/admin/projects/new" style={{ padding: '8px 18px', background: '#b8976a', color: '#0a0a0a', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
          + New Project
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Builds', value: active },
          { label: 'Pre-Construction', value: preCon },
          { label: 'Completed', value: completed },
          { label: 'Total Portfolio', value: formatCurrency(totalValue) },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...card, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,151,106,0.4), transparent)' }} />
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6a5f50', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#b8976a' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Projects</p>
        </div>
        {allProjects.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#4a4030', marginBottom: '8px' }}>No projects yet.</p>
            <Link href="/admin/projects/new" style={{ fontSize: '12px', color: '#b8976a' }}>Create your first project →</Link>
          </div>
        ) : (
          <div>
            {allProjects.map((p) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(184,151,106,0.08)', textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#f5f0e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#4a4030' }}>{p.address}</p>
                  {p.client && (
                    <p style={{ fontSize: '11px', color: '#4a4030', marginTop: '2px' }}>
                      Client: {(p.client as any).full_name ?? (p.client as any).email}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: '16px', flexShrink: 0 }}>
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <div style={{ width: '80px', height: '2px', background: '#2a2318', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#b8976a', width: `${p.progress_percent}%` }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#b8976a' }}>{p.progress_percent}%</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Completion</p>
                    <p style={{ fontSize: '12px', color: '#f5f0e8', marginTop: '2px' }}>{formatDate(p.estimated_completion)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</p>
                    <p style={{ fontSize: '12px', color: '#f5f0e8', marginTop: '2px' }}>{formatCurrency(p.contract_value)}</p>
                  </div>
                  <svg style={{ width: '16px', height: '16px', color: '#4a4030' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
