'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = [
  { bg: '#1a6b5a', label: 'Teal' },
  { bg: '#7a3a1a', label: 'Orange' },
  { bg: '#1a3a6b', label: 'Blue' },
  { bg: '#4a3a1a', label: 'Gold' },
  { bg: '#3a1a5a', label: 'Purple' },
  { bg: '#5a1a1a', label: 'Red' },
  { bg: '#1a4a2a', label: 'Green' },
  { bg: '#3a3a1a', label: 'Olive' },
]

const DEFAULT_PHASES = [
  { name: 'Foundation & Site Work', duration_days: 21, color: '#1a3a6b' },
  { name: 'Rough Framing', duration_days: 21, color: '#1a6b5a' },
  { name: 'Rough MEP', duration_days: 14, color: '#7a3a1a' },
  { name: 'Insulation & Drywall', duration_days: 14, color: '#3a1a5a' },
  { name: 'Finishes & Trim', duration_days: 21, color: '#4a3a1a' },
  { name: 'Cabinets & Countertops', duration_days: 14, color: '#1a4a2a' },
  { name: 'Flooring', duration_days: 10, color: '#7a3a1a' },
  { name: 'Paint', duration_days: 10, color: '#3a3a1a' },
  { name: 'Punch List & Final Walk', duration_days: 7, color: '#5a1a1a' },
]

interface Phase {
  name: string
  duration_days: number
  color: string
  sort_order: number
}

export default function NewTemplatePage() {
  const [name, setName] = useState('New Construction — Standard')
  const [description, setDescription] = useState('')
  const [phases, setPhases] = useState<Phase[]>(
    DEFAULT_PHASES.map((p, i) => ({ ...p, sort_order: i }))
  )
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function updatePhase(index: number, field: string, value: any) {
    setPhases(phases.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addPhase() {
    setPhases([...phases, { name: 'New Phase', duration_days: 14, color: '#4a3a1a', sort_order: phases.length }])
  }

  function removePhase(index: number) {
    setPhases(phases.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!name) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: template } = await supabase
      .from('schedule_templates')
      .insert({ name, description, created_by: user?.id })
      .select()
      .single()

    if (template) {
      await supabase.from('template_phases').insert(
        phases.map(p => ({ ...p, template_id: template.id }))
      )
      router.push(`/admin/templates/${template.id}`)
    }
    setSaving(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }
  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/admin/templates" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Templates</Link>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8', marginBottom: '24px' }}>New Template</h1>

      <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Template Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. New Construction — Standard" />
        </div>
        <div>
          <label style={labelStyle}>Description (optional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="e.g. Standard 12-month new build schedule" />
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Phases</p>
          <p style={{ fontSize: '11px', color: '#4a4030' }}>Set duration in days — dates are calculated when applied to a project</p>
        </div>
        <div>
          {phases.map((phase, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid rgba(184,151,106,0.08)' }}>
              <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <input
                  value={phase.name}
                  onChange={e => updatePhase(i, 'name', e.target.value)}
                  style={{ ...inputStyle, marginBottom: '6px' }}
                  placeholder="Phase name"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={phase.duration_days}
                    onChange={e => updatePhase(i, 'duration_days', parseInt(e.target.value))}
                    style={{ ...inputStyle, width: '80px' }}
                    min="1"
                  />
                  <span style={{ fontSize: '11px', color: '#4a4030' }}>days</span>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    {COLORS.map(c => (
                      <button key={c.bg} onClick={() => updatePhase(i, 'color', c.bg)} style={{ width: '18px', height: '18px', borderRadius: '3px', background: c.bg, border: phase.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => removePhase(i)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px' }}>
          <button onClick={addPhase} style={{ background: 'none', border: '1px dashed rgba(184,151,106,0.2)', borderRadius: '6px', color: '#6a5f50', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 16px', width: '100%' }}>
            + Add Phase
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} disabled={saving || !name} style={{ padding: '10px 24px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Template'}
        </button>
        <Link href="/admin/templates" style={{ padding: '10px 20px', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', fontSize: '11px', color: '#6a5f50', textDecoration: 'none' }}>Cancel</Link>
      </div>
    </div>
  )
}
