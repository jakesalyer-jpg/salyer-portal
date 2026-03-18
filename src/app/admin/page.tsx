import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')

  return (
    <div style={{ padding: '40px', color: '#f5f0e8' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Admin Debug</h1>
      <p style={{ marginBottom: '10px', color: '#b8976a' }}>User ID: {user?.id ?? 'NOT LOGGED IN'}</p>
      <p style={{ marginBottom: '10px', color: '#b8976a' }}>Error: {error?.message ?? 'none'}</p>
      <p style={{ marginBottom: '20px', color: '#b8976a' }}>Projects found: {projects?.length ?? 0}</p>
      <pre style={{ background: '#111', padding: '16px', borderRadius: '8px', fontSize: '12px', color: '#d4b483', overflow: 'auto' }}>
        {JSON.stringify(projects, null, 2)}
      </pre>
      <Link href="/admin/projects/new" style={{ display: 'inline-block', marginTop: '20px', padding: '8px 16px', background: '#b8976a', color: '#0a0a0a', borderRadius: '6px' }}>
        + New Project
      </Link>
    </div>
  )
}
