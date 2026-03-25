'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ApplyTemplateButton from './ApplyTemplateButton'

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface Phase {
  id?: string
  name: string
  duration_days: number
  color: string
  sort_order: number
  depends_on?: string
  lag_days?: number
}

interface Props {
  template: any
  initialPhases: Phase[]
  projects: { id: string; name: string; address: string }[]
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

export default function EditTemplateClient({ template, initialPhases, projects }: Props) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10))
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function updatePhase(index: number, field: string, value: any) {
    setPhases(phases.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addPhase() {
    setPhases([...phases, { name: 'New Phase', duration_days: 14, color: '#4a3a1a', sort_order: phases.length, depends_on: '', lag_days: 0 }])
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
    setSaving(true)
    await supabase.from('schedule_templates').update({ name, description }).eq('id', template.id)
    await supabase.from('template_phases').delete().eq('template_id', template.id)
    await supabase.from('template_phases').insert(phases.map(p => ({
      template_id: template.id,
      name: p.name,
      duration_days: p.duration_days,
      color: p.color,
      sort_order: p.sort_order,
      depends_on: p.depends_on || null,
      lag_days: p.lag_days ?? 0,
    })))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }
  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }
  const totalDays = phases.reduce((sum, p) => sum + p.duration_days, 0)

  const GOLD = '#b8976a'
  const BORDER = 'rgba(184,151,106,0.2)'
  const GOLD_LIGHT = 'rgba(184,151,106,0.12)'
  const TEXT = '#f5f0e8'
  const MUTED = '#6a5f50'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8', marginBottom: '4px' }}>{name}</h1>
          <p style={{ fontSize: '12px', color: '#4a4030' }}>{phases.length} phases · ~{Math.round(totalDays / 30)} months total</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: saved ? '#1a4a2a' : '#b8976a', color: saved ? '#70c090' : '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div>
          <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Template Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Optional description" />
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

            {phases.map((phase, i) => {
              const isExpanded = expandedPhase === i
              const dependsOnPhase = phases.find((p, pi) => p.id === phase.depends_on || (String(pi) === phase.depends_on))
              const dependsOnByIndex = phases.find((p, pi) => String(pi) === phase.depends_on)
              const displayDepend = phases.find(p => p.id ? p.id === phase.depends_on : false) ?? dependsOnByIndex

              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                  style={{ borderBottom: '1px solid rgba(184,151,106,0.08)', background: dragOver === i ? 'rgba(184,151,106,0.06)' : dragIdx === i ? 'rgba(184,151,106,0.03)' : 'transparent', borderTop: dragOver === i ? '2px solid #b8976a' : '2px solid transparent', cursor: 'grab' }}
                >
                  {/* Main row */}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#b8976a', fontSize: '16px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}>⠿</span>
                      <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
                      <input value={phase.name} onChange={e => updatePhase(i, 'name', e.target.value)} onClick={e => e.stopPropagation()} style={{ ...inputStyle, flex: 1 }} />
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedPhase(isExpanded ? null : i) }}
                        style={{ background: 'none', border: `1px solid ${isExpanded ? GOLD : BORDER}`, borderRadius: '4px', color: isExpanded ? GOLD : MUTED, cursor: 'pointer', fontSize: '10px', padding: '4px 8px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      >
                        {isExpanded ? 'Close' : 'Deps'}
                      </button>
                      <button onClick={() => removePhase(i)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '18px', padding: '2px', flexShrink: 0 }}>×</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '30px' }}>
                      <input type="number" value={phase.duration_days} onChange={e => updatePhase(i, 'duration_days', Math.max(1, parseInt(e.target.value) || 1))} onClick={e => e.stopPropagation()} style={{ ...inputStyle, width: '70px' }} min="1" />
                      <span style={{ fontSize: '11px', color: '#4a4030' }}>days</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {COLORS.map(c => (
                          <button key={c.bg} onClick={() => updatePhase(i, 'color', c.bg)} style={{ width: '18px', height: '18px', borderRadius: '3px', background: c.bg, border: phase.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                        ))}
                      </div>
                    </div>

                    {/* Dependency badge when collapsed */}
                    {!isExpanded && (phase.depends_on || (phase.lag_days ?? 0) > 0) && (
                      <div style={{ paddingLeft: '30px', marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {phase.depends_on && (
                          <span style={{ fontSize: '10px', color: GOLD, background: 'rgba(184,151,106,0.12)', border: `1px solid ${GOLD}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            After: {phases.find((p, pi) => (p.id ? p.id === phase.depends_on : String(pi) === phase.depends_on))?.name ?? '—'}
                            {(phase.lag_days ?? 0) > 0 ? ` +${phase.lag_days}d` : ''}
                          </span>
                        )}
                        {!phase.depends_on && (phase.lag_days ?? 0) > 0 && (
                          <span style={{ fontSize: '10px', color: MUTED, background: 'rgba(106,95,80,0.12)', border: `1px solid ${MUTED}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            +{phase.lag_days}d lag
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded dependency panel */}
                  {isExpanded && (
                    <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${GOLD_LIGHT}`, background: 'rgba(184,151,106,0.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Depends On</p>
                        <select
                          value={phase.depends_on ?? ''}
                          onChange={e => updatePhase(i, 'depends_on', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '8px 12px', background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT, fontSize: '12px', outline: 'none' }}
                        >
                          <option value="">None</option>
                          {phases.map((p, pi) => pi !== i && (
                            <option key={pi} value={p.id ?? String(pi)}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Lag Days</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={e => { e.stopPropagation(); updatePhase(i, 'lag_days', Math.max(0, (phase.lag_days ?? 0) - 1)) }}
                            style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >−</button>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, minWidth: '24px', textAlign: 'center' }}>{phase.lag_days ?? 0}</span>
                          <button
                            onClick={e => { e.stopPropagation(); updatePhase(i, 'lag_days', (phase.lag_days ?? 0) + 1) }}
                            style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: MUTED, margin: 0, alignSelf: 'flex-end', paddingBottom: '4px' }}>Changes save with the template.</p>
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{ padding: '12px 16px' }}>
              <button onClick={addPhase} style={{ background: 'none', border: '1px dashed rgba(184,151,106,0.2)', borderRadius: '6px', color: '#6a5f50', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 16px', width: '100%' }}>+ Add Phase</button>
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: '24px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '12px' }}>Live Calendar Preview</p>
          <CalendarPreview phases={phases} startDate={startDate} />
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {phases.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#4a4030' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color }} />
                {p.name}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Apply to Project</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#6a5f50', marginBottom: '16px' }}>Pick a project and start date — all phases will be created automatically.</p>
              <ApplyTemplateButton templateId={template.id} phases={phases} projects={projects} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
