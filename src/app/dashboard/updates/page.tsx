import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Announcement } from '@/types'

export default async function UpdatesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, address')
    .eq('client_id', user.id)
    .single()

  if (!project) return <div className="p-8 text-muted-foreground text-sm">No project found.</div>

  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('project_id', project.id)
    .eq('published', true)
    .order('created_at', { ascending: false })

  const announcements = (data ?? []) as Announcement[]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Updates & Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">Messages and progress updates from your builder.</p>
      </div>

      {announcements.length === 0 && (
        <p className="text-sm text-muted-foreground">No updates yet. Check back soon.</p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className={`bg-card border rounded-xl p-5 ${a.is_urgent ? 'border-destructive/40' : 'border-border'}`}>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  {a.is_urgent && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20 flex-shrink-0">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{timeAgo(a.created_at)} · {formatDate(a.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
