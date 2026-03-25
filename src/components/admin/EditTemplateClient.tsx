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

const GOLD = '#b8976a'
const BORDER = 'rgba(184,151,106,0.2)'
const GOLD_LIGHT = 'rgba(184,151,106,0.12)'
const TEXT = '#f5f0e8'
const MUTED = '#6a5f50'

interface Phase {
  id?: string
  name: string
  duration_days: number
  color: string
  sort_order: number
  depends_on?: string
  lag_days?: number
  parallel_with?: string
  start_offset?: number
}

interface Props {
  template: any
  initialPhases: Phase[]
  projects: { id: string; name: string; address: string }[]
}

// Compute the start date (as ms offset from base) for each phase index
function computePhaseStarts(phases: Phase[], baseMs: number): number[] {
  const starts: number[] = new Array(phases.length).fill(-1)
  const DAY = 86400000

  // We resolve in sort_order. Phases with no dependency or parallel start sequentially.
  // parallel_with: start at same time as referenced phase + start_offset days
  // depends_on: start after referenced phase ends + lag_days

  // Build a sequential cursor for phases that have no special relationship
  let cursor = baseMs

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]

    if (phase.parallel_with) {
      // Find the referenced phase index by id or string index
      const refIdx = phases.findIndex((p, pi) =>
        p.id ? p.id === phase.parallel_with : String(pi) === phase.parallel_with
      )
      if (refIdx !== -1 && starts[refIdx] !== -1) {
        starts[i] = starts[refIdx] + (phase.start_offset ?? 0) * DAY
        // Don't advance cursor — parallel phase doesn't push the sequence
        continue
      }
    }

    if (phase.depends_on) {
      const refIdx = phases.findIndex((p, pi) =>
        p.id ? p.id === phase.depends_on : String(pi) === phase.depends_on
      )
      if (refIdx !== -1 && starts[refIdx] !== -1) {
        starts[i] = starts[refIdx] + phases[refIdx].duration_days * DAY + (phase.lag_days ?? 0) * DAY
        cursor = Math.max(cursor, starts[i] + phase.duration_days * DAY)
        continue
      }
    }

    // Sequential fallback
    starts[i] = cursor
    cursor = cursor + phase.duration_days * DAY
  }

  return starts
}

function CalendarPreview({
  phases,
  startDate,
  onClickPhase,
}: {
  phases: Phase[]
  startDate: string
  onClickPhase: (index: number) => void
}) {
  const [viewDate, setViewDate] = useState(() => startDate ? new Date(startDate + 'T00:00:00') : new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const base = startDate ? new Date(startDate + 'T00:00:00') : new Date()
  const DAY = 86400000

  const phaseStarts = computePhaseStarts(phases, base.getTime())

  function getPhasesForDay(day: number): { phase: Phase; index: number; isStart: boolean }[] {
    const dateMs = new Date(year, month, day, 12, 0, 0).getTime()
    const result: { phase: Phase; index: number; isStart: boolean }[] = []
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      const startMs = phaseStarts[i]
      if (startMs === -1) continue
      const endMs = startMs + phase.duration_days * DAY
      if (dateMs >= startMs && dateMs < endMs) {
        const startDateStr = new Date(startMs).toISOString().slice(0, 10)
        const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        result.push({ phase, index: i, isStart: startDateStr === dayStr })
      }
    }
    return result
  }

  function isSunday(day: number) { return new Date(year, month, day).getDay() === 0 }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ background: '#111111', border: `1px solid ${GOLD_LIGHT}`, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
        <button onClick={() => setViewDate(new Date(year, month-1, 1))} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '4px', color: GOLD, cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px' }}>‹</button>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', color: '#d4b483' }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '4px', color: GOLD, cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid rgba(184,151,106,0.08)' }}>
        {DAYS.map(d => <div key={d} style={{ padding: '6px 2px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {cells.map((day, idx) => {
          const isWeekend = day ? [0,6].includes(new Date(year,month,day).getDay()) : false
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayPhases = day ? getPhasesForDay(day) : []
          return (
            <div key={idx} style={{ minHeight: '64px', borderRight: '1px solid rgba(184,151,106,0.05)', borderBottom: '1px solid rgba(184,151,106,0.05)', padding: '3px 2px', background: isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent', position: 'relative' }}>
              {day && (
                <>
                  <div style={{ width: isToday ? '18px' : 'auto', height: isToday ? '18px' : 'auto', borderRadius: isToday ? '50%' : 0, background: isToday ? GOLD : 'transparent', color: isToday ? '#0a0a0a' : MUTED, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>{day}</div>
                  {dayPhases.map(({ phase, index, isStart }) => {
                    const c = COLORS.find(c => c.bg === phase.color)
                    return (
                      <div
                        key={index}
                        onClick={() => onClickPhase(index)}
                        style={{ background: phase.color, color: c?.text ?? '#fff', borderRadius: '2px', padding: '2px 4px', fontSize: '9px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', position: 'relative', zIndex: 2, userSelect: 'none', marginBottom: '1px' }}
                      >
                        {(isStart || isSunday(day)) ? phase.name : '\u00a0'}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${GOLD_LIGHT}`, fontSize: '10px', color: MUTED }}>
        Click a phase bar to edit it
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

  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number | null>(null)
  const [phaseEditForm, setPhaseEditForm] = useState<{
    name: string
    duration_days: string
    color: string
    depends_on: string
    lag_days: string
    parallel_with: string
    start_offset: string
  }>({ name: '', duration_days: '', color: COLORS[0].bg, depends_on: '', lag_days: '0', parallel_with: '', start_offset: '0' })

  const router = useRouter()
  const supabase = createClient()

  function openPhaseModal(index: number) {
    const phase = phases[index]
    setSelectedPhaseIdx(index)
    setPhaseEditForm({
      name: phase.name,
      duration_days: String(phase.duration_days),
      color: phase.color,
      depends_on: phase.depends_on ?? '',
      lag_days: String(phase.lag_days ?? 0),
      parallel_with: phase.parallel_with ?? '',
      start_offset: String(phase.start_offset ?? 0),
    })
  }

  function savePhaseModal() {
    if (selectedPhaseIdx === null) return
    // Can't have both parallel_with and depends_on — parallel takes priority if set
    const hasParallel = !!phaseEditForm.parallel_with
    setPhases(prev => prev.map((p, i) => i === selectedPhaseIdx ? {
      ...p,
      name: phaseEditForm.name,
      duration_days: Math.max(1, parseInt(phaseEditForm.duration_days) || 1),
      color: phaseEditForm.color,
      depends_on: hasParallel ? undefined : (phaseEditForm.depends_on || undefined),
      lag_days: hasParallel ? 0 : (parseInt(phaseEditForm.lag_days) || 0),
      parallel_with: phaseEditForm.parallel_with || undefined,
      start_offset: parseInt(phaseEditForm.start_offset) || 0,
    } : p))
    setSelectedPhaseIdx(null)
  }

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
      parallel_with: p.parallel_with || null,
      start_offset: p.start_offset ?? 0,
    })))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: MUTED, marginBottom: '6px' }
  const card = { background: '#111111', border: `1px solid ${GOLD_LIGHT}`, borderRadius: '8px' }
  const totalDays = phases.reduce((sum, p) => sum + p.duration_days, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: TEXT, marginBottom: '4px' }}>{name}</h1>
          <p style={{ fontSize: '12px', color: '#4a4030' }}>{phases.length} phases · ~{Math.round(totalDays / 30)} months total</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: saved ? '#1a4a2a' : GOLD, color: saved ? '#70c090' : '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s' }}>
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
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${GOLD_LIGHT}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: MUTED }}>Phases</p>
              <p style={{ fontSize: '10px', color: '#4a4030' }}>Drag ⠿ to reorder</p>
            </div>

            {phases.map((phase, i) => {
              const isExpanded = expandedPhase === i
              const parallelPhase = phases.find((p, pi) => p.id ? p.id === phase.parallel_with : String(pi) === phase.parallel_with)
              const dependsOnPhase = phases.find((p, pi) => p.id ? p.id === phase.depends_on : String(pi) === phase.depends_on)

              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                  style={{ borderBottom: '1px solid rgba(184,151,106,0.08)', background: dragOver === i ? 'rgba(184,151,106,0.06)' : dragIdx === i ? 'rgba(184,151,106,0.03)' : 'transparent', borderTop: dragOver === i ? `2px solid ${GOLD}` : '2px solid transparent', cursor: 'grab' }}
                >
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: GOLD, fontSize: '16px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}>⠿</span>
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

                    {/* Badges */}
                    {!isExpanded && (parallelPhase || dependsOnPhase || (phase.lag_days ?? 0) > 0) && (
                      <div style={{ paddingLeft: '30px', marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {parallelPhase && (
                          <span style={{ fontSize: '10px', color: '#70a0f0', background: 'rgba(106,143,184,0.12)', border: '1px solid rgba(106,143,184,0.3)', borderRadius: '4px', padding: '1px 6px' }}>
                            ∥ {parallelPhase.name}{(phase.start_offset ?? 0) > 0 ? ` +${phase.start_offset}d` : ''}
                          </span>
                        )}
                        {!parallelPhase && dependsOnPhase && (
                          <span style={{ fontSize: '10px', color: GOLD, background: 'rgba(184,151,106,0.12)', border: `1px solid ${GOLD}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            After: {dependsOnPhase.name}{(phase.lag_days ?? 0) > 0 ? ` +${phase.lag_days}d` : ''}
                          </span>
                        )}
                        {!parallelPhase && !dependsOnPhase && (phase.lag_days ?? 0) > 0 && (
                          <span style={{ fontSize: '10px', color: MUTED, background: 'rgba(106,95,80,0.12)', border: `1px solid ${MUTED}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            +{phase.lag_days}d lag
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${GOLD_LIGHT}`, background: 'rgba(184,151,106,0.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Depends On</p>
                        <select value={phase.depends_on ?? ''} onChange={e => updatePhase(i, 'depends_on', e.target.value)} onClick={e => e.stopPropagation()} style={{ padding: '8px 12px', background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT, fontSize: '12px', outline: 'none' }}>
                          <option value="">None</option>
                          {phases.map((p, pi) => pi !== i && <option key={pi} value={p.id ?? String(pi)}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Lag Days</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={e => { e.stopPropagation(); updatePhase(i, 'lag_days', Math.max(0, (phase.lag_days ?? 0) - 1)) }} style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, minWidth: '24px', textAlign: 'center' }}>{phase.lag_days ?? 0}</span>
                          <button onClick={e => { e.stopPropagation(); updatePhase(i, 'lag_days', (phase.lag_days ?? 0) + 1) }} style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{ padding: '12px 16px' }}>
              <button onClick={addPhase} style={{ background: 'none', border: `1px dashed ${BORDER}`, borderRadius: '6px', color: MUTED, cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 16px', width: '100%' }}>+ Add Phase</button>
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: '24px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: MUTED, marginBottom: '12px' }}>Live Calendar Preview</p>
          <CalendarPreview phases={phases} startDate={startDate} onClickPhase={openPhaseModal} />
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {phases.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#4a4030' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color }} />
                {p.name}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', background: '#111111', border: `1px solid ${GOLD_LIGHT}`, borderRadius: '8px' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: MUTED }}>Apply to Project</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '16px' }}>Pick a project and start date — all phases will be created automatically.</p>
              <ApplyTemplateButton templateId={template.id} phases={phases} projects={projects} />
            </div>
          </div>
        </div>
      </div>

      {/* Phase edit modal */}
      {selectedPhaseIdx !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: TEXT }}>Edit Phase</h2>
              <button onClick={() => setSelectedPhaseIdx(null)} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Phase Name</label>
                <input value={phaseEditForm.name} onChange={e => setPhaseEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </div>

              {/* Duration */}
              <div>
                <label style={labelStyle}>Duration (Work Days)</label>
                <input type="number" min="1" value={phaseEditForm.duration_days} onChange={e => setPhaseEditForm(f => ({ ...f, duration_days: e.target.value }))} style={inputStyle} />
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${GOLD_LIGHT}`, paddingTop: '14px' }}>
                <p style={{ fontSize: '11px', color: MUTED, marginBottom: '12px' }}>Choose one: run after another phase, or run alongside one.</p>

                {/* Depends On + Lag */}
                <div style={{ background: phaseEditForm.parallel_with ? 'rgba(0,0,0,0.2)' : 'rgba(184,151,106,0.04)', border: `1px solid ${phaseEditForm.parallel_with ? 'transparent' : GOLD_LIGHT}`, borderRadius: '6px', padding: '12px', marginBottom: '10px', opacity: phaseEditForm.parallel_with ? 0.4 : 1 }}>
                  <p style={{ fontSize: '10px', color: GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Sequential — runs after</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Predecessor</label>
                      <select value={phaseEditForm.depends_on} onChange={e => setPhaseEditForm(f => ({ ...f, depends_on: e.target.value, parallel_with: '', start_offset: '0' }))} style={inputStyle} disabled={!!phaseEditForm.parallel_with}>
                        <option value="">None</option>
                        {phases.map((p, pi) => pi !== selectedPhaseIdx && (
                          <option key={pi} value={p.id ?? String(pi)}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Lag Days</label>
                      <input type="number" min="0" value={phaseEditForm.lag_days} onChange={e => setPhaseEditForm(f => ({ ...f, lag_days: e.target.value }))} style={inputStyle} disabled={!!phaseEditForm.parallel_with} />
                    </div>
                  </div>
                </div>

                {/* Parallel With + Offset */}
                <div style={{ background: phaseEditForm.depends_on ? 'rgba(0,0,0,0.2)' : 'rgba(106,143,184,0.04)', border: `1px solid ${phaseEditForm.depends_on ? 'transparent' : 'rgba(106,143,184,0.2)'}`, borderRadius: '6px', padding: '12px', opacity: phaseEditForm.depends_on ? 0.4 : 1 }}>
                  <p style={{ fontSize: '10px', color: '#70a0f0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Parallel — runs alongside</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Run Alongside</label>
                      <select value={phaseEditForm.parallel_with} onChange={e => setPhaseEditForm(f => ({ ...f, parallel_with: e.target.value, depends_on: '', lag_days: '0' }))} style={inputStyle} disabled={!!phaseEditForm.depends_on}>
                        <option value="">None</option>
                        {phases.map((p, pi) => pi !== selectedPhaseIdx && (
                          <option key={pi} value={p.id ?? String(pi)}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Start Offset</label>
                      <input type="number" min="0" value={phaseEditForm.start_offset} onChange={e => setPhaseEditForm(f => ({ ...f, start_offset: e.target.value }))} style={inputStyle} disabled={!!phaseEditForm.depends_on} placeholder="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '10px', color: MUTED, marginTop: '8px' }}>Start offset = days after the parallel phase begins (0 = same day)</p>
                </div>
              </div>

              {/* Color */}
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c.bg} onClick={() => setPhaseEditForm(f => ({ ...f, color: c.bg }))} style={{ width: '28px', height: '28px', borderRadius: '4px', background: c.bg, border: phaseEditForm.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={savePhaseModal} style={{ flex: 1, padding: '10px', background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>
                Save Phase
              </button>
              <button onClick={() => { removePhase(selectedPhaseIdx); setSelectedPhaseIdx(null) }} style={{ padding: '10px 16px', background: 'none', border: '1px solid rgba(180,60,60,0.2)', borderRadius: '6px', color: '#e07070', fontSize: '12px', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setSelectedPhaseIdx(null)} style={{ padding: '10px 16px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', color: MUTED, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
