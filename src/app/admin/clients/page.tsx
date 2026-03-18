import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminClientsPage() {
  const supabase = createClient()

  const { data: clients } = await supabase
    .from('profiles')
    .select('*, projects(id, name, status, progress_percent)')
    .eq('role', 'client')
    .order('full_name')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients?.length ?? 0} total clients</p>
        </div>
        <Link href="/admin/clients/invite" className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors">
          + Invite Client
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {!clients?.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client: any) => (
              <div key={client.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-semibold text-brand flex-shrink-0">
                  {getInitials(client.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{client.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                  {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                </div>
                <div className="hidden md:block text-sm text-muted-foreground">
                  {(client.projects ?? []).length} project(s)
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(client.projects ?? []).map((p: any) => (
                    <Link key={p.id} href={`/admin/projects/${p.id}`} className="text-xs text-brand hover:underline">
                      {p.name}
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">Joined {formatDate(client.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
