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
  pending: 'rgba(184,151,106,0.1)',
  submitted: 'rgba(60,100,180,0.1)',
  approved: 'rgba(60,120,80,0.1)',
  revision_needed: 'rgba(180,60,60,0.1)',
}

const STATUS_TEXT: Record<string, string> = {
  pending: '#b8976a',
  submitted: '#70a0f0',
  approved: '#70b080',
  revision_needed: '#e07070',
}

export default function SelectionsPage() {
  const [selections, setSelections] = useState<any[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
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

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: project } = await supabase.from('projects').select('id').eq('client_id', user.id).single()
      if (!project) { setLoading(false); return }
      setProjectId(project.id)

      const { data } = await supabase.from('selections').select('*').eq('project_id', project.id).order('sort_order')
      setSelections(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = selections.reduce<Record<string, any[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  async function handleSubmit(sel: any) {
    setSaving(true)
    const { data } = await supabase.from('selections')
      .update({ client_choice: editChoice, client_notes: editNotes, status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', sel.id).select().single()
    if (data) setSelections(prev => prev.map(s => s.id === sel.id ? data : s))
    setEditingId(null)
    setSaving(false)
  }

  async function handleSignoff(sel: any) {
    const { data } = await supabase.from('selections')
      .update({ signoff_by: profile?.id, signoff_name: profile?.full_name ?? profile?.email, signoff_at: new Date().toISOString(), status: 'approved' })
      .eq('id', sel.id).select().single()
    if (data) setSelections(prev => prev.map(s => s.id === sel.id ? data : s))
  }

  if (loading) return <div className="p-8 text-sm" style={{ color: '#6a5f50' }}>Loading selections…</div>

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>Selections & Deadlines</h1>
        <p className="text-sm mt-1" style={{ color: '#6a5f50' }}>Submit your choices before each deadline to keep your build on schedule.</p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm" style={{ color: '#6a5f50' }}>No selections added yet. Check back soon.</p>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#6a5f50', marginBottom: '12px' }}>{category}</h2>
            <div className="space-y-3">
              {items.map((sel) => {
                const days = daysUntil(sel.deadline)
                const isEditing = editingId === sel.id
                const isSigned = !!sel.signoff_at

                return (
                  <div key={sel.id} style={{ background: '#111111', border: `1px solid ${isSigned ? 'rgba(60,120,80,0.3)' : 'rgba(184,151,106,0.12)'}`, borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#f5f0e8', marginBottom: '4px' }}>{sel.item_name}</h3>
                        {sel.description && <p style={{ fontSize: '12px', color: '#4a4030' }}>{sel.description}</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '3px', background: STATUS_COLORS[sel.status], color: STATUS_TEXT[sel.status], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {STATUS_LABELS[sel.status]}
                        </span>
                      </div>
                    </div>

                    {sel.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#4a4030' }}>Deadline: {formatDate(sel.deadline)}</span>
                        <UrgencyBadge days={days} />
                      </div>
                    )}

                    {sel.client_choice && !isEditing && (
                      <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '10px', color: '#6a5f50', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Your selection</p>
                        <p style={{ fontSize: '13px', color: '#f5f0e8' }}>{sel.client_choice}</p>
                        {sel.client_notes && <p style={{ fontSize: '12px', color: '#6a5f50', marginTop: '4px' }}>{sel.client_notes}</p>}
                      </div>
                    )}

                    {sel.builder_notes && (
                      <div style={{ background: 'rgba(60,100,180,0.08)', border: '1px solid rgba(60,100,180,0.2)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '10px', color: '#70a0f0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Builder note</p>
                        <p style={{ fontSize: '13px', color: '#f5f0e8' }}>{sel.builder_notes}</p>
                      </div>
                    )}

                    {/* Sign-off section */}
                    {sel.requires_signoff && (
                      <div style={{ marginBottom: '12px' }}>
                        {isSigned ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(60,120,80,0.08)', border: '1px solid rgba(60,120,80,0.2)', borderRadius: '6px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1a4a2a', border: '1px solid rgba(60,120,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#70b080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div>
                              <p style={{ fontSize: '12px', color: '#70b080', fontWeight: 500 }}>Signed off by {sel.signoff_name}</p>
                              <p style={{ fontSize: '11px', color: '#4a4030' }}>{formatDate(sel.signoff_at)}</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(184,151,106,0.05)', border: '1px solid rgba(184,151,106,0.15)', borderRadius: '6px', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: '12px', color: '#6a5f50' }}>This selection requires your sign-off</p>
                            {sel.client_choice && (
                              <button onClick={() => handleSignoff(sel)} style={{ padding: '6px 14px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', flexShrink: 0 }}>
                                Sign Off ✓
                              </button>
                            )}
                            {!sel.client_choice && <p style={{ fontSize: '11px', color: '#4a4030' }}>Submit your selection first</p>}
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }}>Your Selection / Choice</label>
                          <input value={editChoice} onChange={e => setEditChoice(e.target.value)} placeholder="e.g. Shaw Floors — Titan HD, color: Ash" style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }}>Notes (optional)</label>
                          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} placeholder="Any additional notes…" style={{ ...inputStyle, resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleSubmit(sel)} disabled={saving || !editChoice} style={{ padding: '8px 16px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: saving || !editChoice ? 0.5 : 1 }}>
                            {saving ? 'Submitting…' : 'Submit Selection'}
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', fontSize: '12px', color: '#6a5f50', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : !isSigned && sel.status !== 'approved' && (
                      <button onClick={() => { setEditingId(sel.id); setEditChoice(sel.client_choice ?? ''); setEditNotes(sel.client_notes ?? '') }} style={{ fontSize: '12px', color: '#b8976a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
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
