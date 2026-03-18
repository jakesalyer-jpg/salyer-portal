'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

const ICONS = ['📋', '📸', '⚠️', '✅', '🔨', '🏠', '📅', '💬']

interface Props {
  projectId: string
  initialAnnouncements: any[]
}

export default function AdminAnnouncementForm({ projectId, initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [icon, setIcon] = useState('📋')
  const [isUrgent, setIsUrgent] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !body) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('announcements')
      .insert({ project_id: projectId, title, body, icon, is_urgent: isUrgent, created_by: user?.id })
      .select()
      .single()

    if (data) {
      setAnnouncements([data, ...announcements])
      setTitle('')
      setBody('')
      setIcon('📋')
      setIsUrgent(false)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* New announcement form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Post New Update</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${icon === ic ? 'bg-brand/10 ring-1 ring-brand' : 'bg-secondary hover:bg-muted'}`}
              >
                {ic}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title…"
            required
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your update for the client…"
            rows={3}
            required
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="rounded"
              />
              Mark as urgent
            </label>
            <button
              type="submit"
              disabled={saving || !title || !body}
              className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post Update'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing announcements */}
      {announcements.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/40">
            <h3 className="text-sm font-semibold">Posted Updates</h3>
          </div>
          <div className="divide-y divide-border">
            {announcements.map((a: any) => (
              <div key={a.id} className="flex gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base flex-shrink-0">{a.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.is_urgent && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Urgent</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
