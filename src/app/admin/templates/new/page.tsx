'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = [
  { bg: '#1a6b5a', text: '#7fe0c8', label: 'Teal' },
  { bg: '#7a3a1a', text: '#f0a070', label: 'Orange' },
  { bg: '#1a3a6b', text: '#70a0f0', label: 'Blue' },
  { bg: '#4a3a1a', text: '#d4b483', label: 'Gold' },
  { bg: '#3a1a5a', text: '#c090e0', label: 'Purple' },
  { bg: '#5a1a1a', text: '#e07070', label: 'Red' },
  { bg: '#1a4a2a', text: '#70c090', label: 'Green' },
  { bg: '#3a3a1a', text: '#c0c070', label: 'Olive' },
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface Phase {
  name: string
  duration_days: number
  color: string
  sort_order: number
}

function CalendarPreview({ phases, startDate }: { phases: Phase[], startDate: string }) {
  const [viewDate, setViewDate] = useState(() => startDate ? new Date(startDate + 'T00:00:00') : new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const base = startDate ? new Date(startDate + 'T00:00:00') : new Date()

  function getPhaseForDay(day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    let current = new Date(base)
    for (const phase of phases) {
      const pStart = current.toISOString().slice(0,10)
      const pEnd = new Date(current.getTime() + phase.duration_days * 86400000)
      const pEndStr = pEnd.toISOString().slice(0,10)
      if (dateStr >= pStart && dateStr < pEndStr) return phase
      current = pEnd
    }
    return null
  }

  function isPhaseStart(phase: Phase, day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    let current = new Date(base)
    for (const p of phases) {
      if (p === phase) return current.toISOString().slice(0,10) === dateStr
      current = new Date(current.getTime() + p.duration_days * 86400000)
    }
    return false
  }

  function isSunday(day: number) { return new Date(year, month, day).getDay() === 0 }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
        <button onClick={() => setViewDate(new Date(year, month-1, 1))} style={{ background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '4px', color: '#b8976a', cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px' }}>‹</button>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', color: '#d4b483' }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))} style={{ background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '4px', color: '#b8976a', cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid rgba(184,151,106,0.08)' }}>
        {DAYS.map(d => <div key={d} style={{ padding: '6px 2px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {cells.map((day, idx) => {
          const isWeekend = day ? [0,6].includes(new Date(year,month,day).getDay()) : false
          const phase = day ? getPhaseForDay(day) : null
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const c = COLORS.find(c => c.bg === phase?.color)
          return (
            <div key={idx} style={{ minHeight: '64px', borderRight: '1px solid rgba(184,151,106,0.05)', borderBottom: '1px solid rgba(184,151,106,0.05)', padding: '3px 2px', background: isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              {day && (
                <>
                  <div style={{ width: isToday ? '18px' : 'auto', height: isToday ? '18px' : 'auto', borderRadius: isToday ? '50%' : 0, background: isToday ? '#b8976a' : 'transparent', color: isToday ? '#0a0a0a' : '#4a4030', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>{day}</div>
                  {phase && (
                    <div style={{ background: phase.color, color: c?.text ?? '#fff', borderRadius: '2px', padding: '1px 3px', fontSize: '8px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(isPhaseStart(phase, day) || isSunday(day)) ? phase.name : '\u00a0'}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function NewTemplatePage() {
  const [name, setName] = useState('New Construction — Standard')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10))
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES.map((p, i) => ({ ...p, sort_order: i })))
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
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

  function handleDragStart(i: number) { setDragIdx(i) }
  function handleDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOver(i) }
  function handleDrop(i: number) {
    if (dragIdx === null || dragIdx === i) return
    const newPhases = [...phases]
    const [moved] = newPhases.splice(dragIdx, 1)
    newPhases.splice(i, 0, moved)
    setPhases(newPhases.map((p, idx) => ({ ...p, sort_order: idx })))
    setDragIdx(null)
    setDragOver(null)
  }

  async function handleSave() {
    if (!name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: template } = await supabase.from('schedule_templates').insert({ name, description, created_by: user?.id }).select().single()
    if (template) {
      await supabase.from('template_phases').insert(phases.map(p => ({ ...p, template_id: template.id })))
      router.push(`/admin/templates/${template.id}`)
    }
    setSaving(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }
  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Link href="/admin/templates" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Templates</Link>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8', marginBottom: '24px' }}>New Template</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Left column — editor */}
        <div>
          <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Template Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Description (optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="e.g. Standard 12-month new build" />
            </div>
            <div>
              <label style={labelStyle}>Preview Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ ...card, overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Phases</p>
              <p style={{ fontSize: '10px', color: '#4a4030' }}>Drag ⠿ to reorder</p>
            </div>
            {phases.map((phase, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(184,151,106,0.08)',
                  background: dragOver === i ? 'rgba(184,151,106,0.06)' : dragIdx === i ? 'rgba(184,151,106,0.03)' : 'transparent',
                  borderTop: dragOver === i ? '2px solid #b8976a' : '2px solid transparent',
                  cursor: 'grab',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ color: '#b8976a', fontSize: '16px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}>⠿</span>
                  <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
                  <input
                    value={phase.name}
                    onChange={e => updatePhase(i, 'name', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={() => removePhase(i)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '18px', padding: '2px', flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '30px' }}>
                  <input
                    type="number"
                    value={phase.duration_days}
                    onChange={e => updatePhase(i, 'duration_days', Math.max(1, parseInt(e.target.value) || 1))}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, width: '70px' }}
                    min="1"
                  />
                  <span style={{ fontSize: '11px', color: '#4a4030' }}>days</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button
                        key={c.bg}
                        onClick={() => updatePhase(i, 'color', c.bg)}
                        style={{ width: '18px', height: '18px', borderRadius: '3px', background: c.bg, border: phase.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 16px' }}>
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

        {/* Right column — calendar preview */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '12px' }}>Live Calendar Preview</p>
          <CalendarPreview phases={phases} startDate={startDate} />
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {phases.map((p, i) => {
              const c = COLORS.find(c => c.bg === p.color)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#4a4030' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color }} />
                  {p.name}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
