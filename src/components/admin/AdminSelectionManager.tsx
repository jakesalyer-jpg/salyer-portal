'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, daysUntil, SELECTION_STATUS_LABELS } from '@/lib/utils'
import UrgencyBadge from '@/components/shared/UrgencyBadge'
import type { Selection } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  revision_needed: 'bg-red-50 text-red-700 border-red-200',
}

interface Props {
  projectId: string
  initialSelections: Selection[]
}

export default function AdminSelectionManager({ projectId, initialSelections }: Props) {
  const [selections, setSelections] = useState<Selection[]>(initialSelections)
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem] = useState({ category: '', item_name: '', description: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [builderNotes, setBuilderNotes] = useState('')
  const supabase = createClient()

  async function addSelection() {
    if (!newItem.category || !newItem.item_name) return
    setSaving(true)
    const { data } = await supabase
      .from('selections')
      .insert({ project_id: projectId, ...newItem, sort_order: selections.length })
      .select()
      .single()
    if (data) setSelections([...selections, data])
    setNewItem({ category: '', item_name: '', description: '', deadline: '' })
    setAddingNew(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    const { data } = await supabase
      .from('selections')
      .update({ status, ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}) })
      .eq('id', id)
      .select()
      .single()
    if (data) setSelections(selections.map((s) => (s.id === id ? data : s)))
  }

  async function saveBuilderNotes(id: string) {
    const { data } = await supabase
      .from('selections')
      .update({ builder_notes: builderNotes })
      .eq('id', id)
      .select()
      .single()
    if (data) setSelections(selections.map((s) => (s.id === id ? data : s)))
    setEditingNotes(null)
  }

  return (
    <div className="space-y-3">
      {selections.length === 0 && !addingNew && (
        <p className="text-sm text-muted-foreground">No selections yet.</p>
      )}
      {selections.map((sel) => (
        <div key={sel.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{sel.category}</span>
              <p className="text-sm font-semibold">{sel.item_name}</p>
              {sel.description && <p className="text-xs text-muted-foreground mt-0.5">{sel.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <UrgencyBadge days={daysUntil(sel.deadline)} />
              <select
                value={sel.status}
                onChange={(e) => updateStatus(sel.id, e.target.value)}
                className={`text-xs px-2 py-0.5 rounded-full border font-medium cursor-pointer ${STATUS_COLORS[sel.status]}`}
              >
                {Object.entries(SELECTION_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {sel.deadline && (
            <p className="text-xs text-muted-foreground mb-2">Deadline: {formatDate(sel.deadline)}</p>
          )}

          {sel.client_choice && (
            <div className="bg-secondary rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-muted-foreground mb-0.5">Client's selection</p>
              <p className="text-sm font-medium">{sel.client_choice}</p>
              {sel.client_notes && <p className="text-xs text-muted-foreground mt-1">{sel.client_notes}</p>}
            </div>
          )}

          {editingNotes === sel.id ? (
            <div className="space-y-2">
              <textarea
                value={builderNotes}
                onChange={(e) => setBuilderNotes(e.target.value)}
                rows={2}
                placeholder="Add a note for the client…"
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => saveBuilderNotes(sel.id)} className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg">Save</button>
                <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 border border-border text-xs rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setEditingNotes(sel.id); setBuilderNotes(sel.builder_notes ?? '') }}
              className="text-xs text-brand hover:underline"
            >
              {sel.builder_notes ? 'Edit builder note' : '+ Add builder note'}
            </button>
          )}
        </div>
      ))}

      {addingNew ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Category (e.g. Flooring)" className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={newItem.item_name} onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })} placeholder="Item name (e.g. Hardwood — Main Level)" className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description (optional)" className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="date" value={newItem.deadline} onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={addSelection} disabled={saving || !newItem.category || !newItem.item_name} className="px-4 py-2 bg-brand text-white text-sm rounded-lg disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Selection'}
            </button>
            <button onClick={() => setAddingNew(false)} className="px-4 py-2 border border-border text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingNew(true)} className="w-full py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          + Add Selection Item
        </button>
      )}
    </div>
  )
}
