'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Selection } from '@/types'
import UrgencyBadge from '@/components/shared/UrgencyBadge'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  revision_needed: 'Revision Needed',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  revision_needed: 'bg-red-50 text-red-700 border-red-200',
}

export default function SelectionsPage() {
  const [selections, setSelections] = useState<Selection[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editChoice, setEditChoice] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
        .single()

      if (!project) { setLoading(false); return }
      setProjectId(project.id)

      const { data } = await supabase
        .from('selections')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order')

      setSelections(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = selections.reduce<Record<string, Selection[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  async function handleSubmit(sel: Selection) {
    setSaving(true)
    const { data } = await supabase
      .from('selections')
      .update({
        client_choice: editChoice,
        client_notes: editNotes,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', sel.id)
      .select()
      .single()

    if (data) {
      setSelections((prev) => prev.map((s) => (s.id === sel.id ? data : s)))
    }
    setEditingId(null)
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading selections…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Selections & Deadlines</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit your choices before each deadline to keep your build on schedule.</p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground">No selections added yet. Check back soon.</p>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">{category}</h2>
            <div className="space-y-3">
              {items.map((sel) => {
                const days = daysUntil(sel.deadline)
                const isEditing = editingId === sel.id

                return (
                  <div key={sel.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold">{sel.item_name}</h3>
                        {sel.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{sel.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[sel.status]}`}>
                          {STATUS_LABELS[sel.status]}
                        </span>
                      </div>
                    </div>

                    {sel.deadline && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground">Deadline: {formatDate(sel.deadline)}</span>
                        <UrgencyBadge days={days} />
                      </div>
                    )}

                    {sel.client_choice && !isEditing && (
                      <div className="bg-secondary rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Your selection</p>
                        <p className="text-sm font-medium">{sel.client_choice}</p>
                        {sel.client_notes && <p className="text-xs text-muted-foreground mt-1">{sel.client_notes}</p>}
                      </div>
                    )}

                    {sel.builder_notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">Builder note</p>
                        <p className="text-sm text-blue-800">{sel.builder_notes}</p>
                      </div>
                    )}

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Your Selection / Choice</label>
                          <input
                            value={editChoice}
                            onChange={(e) => setEditChoice(e.target.value)}
                            placeholder="e.g. Shaw Floors — Titan HD, color: Ash"
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Notes (optional)</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={2}
                            placeholder="Any additional notes for your builder…"
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmit(sel)}
                            disabled={saving || !editChoice}
                            className="px-4 py-2 bg-brand text-white text-sm rounded-lg font-medium hover:bg-brand/90 disabled:opacity-50"
                          >
                            {saving ? 'Submitting…' : 'Submit Selection'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : sel.status !== 'approved' && (
                      <button
                        onClick={() => {
                          setEditingId(sel.id)
                          setEditChoice(sel.client_choice ?? '')
                          setEditNotes(sel.client_notes ?? '')
                        }}
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        {sel.client_choice ? 'Edit selection →' : 'Make selection →'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
