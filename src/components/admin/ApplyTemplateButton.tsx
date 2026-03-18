'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Phase {
  id?: string
  name: string
  duration_days: number
  color: string
  sort_order: number
}

interface Project {
  id: string
  name: string
  address: string
}

interface Props {
  templateId: string
  phases: Phase[]
  projects: Project[]
}

export default function ApplyTemplateButton({ templateId, phases, projects }: Props) {
  const [projectId, setProjectId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleApply() {
    if (!projectId || !startDate) return
    setApplying(true)

    let currentDate = new Date(startDate)

    for (const phase of phases) {
      const phaseStart = currentDate.toISOString().slice(0, 10)
      const phaseEnd = new Date(currentDate.getTime() + phase.duration_days * 24 * 60 * 60 * 1000)
      const phaseEndStr = phaseEnd.toISOString().slice(0, 10)

      const { data: newPhase } = await supabase
        .from('project_phases')
        .insert({
          project_id: projectId,
          name: phase.name,
          sort_order: phase.sort_order,
          start_date: phaseStart,
          end_date: phaseEndStr,
          status: 'pending',
        })
        .select()
        .single()

      if (newPhase) {
        await supabase.from('tasks').insert({
          project_id: projectId,
          phase_id: newPhase.id,
          name: phase.name,
          start_date: phaseStart,
          due_date: phaseEndStr,
          color: phase.color,
          is_completed: false,
          sort_order: 0,
        })
      }

      currentDate = phaseEnd
    }

    setApplying(false)
    setSuccess(true)
    setTimeout(() => {
      router.push(`/admin/projects/${projectId}`)
    }, 1500)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ fontSize: '16px', fontFamily: 'Cormorant Garamond, serif', color: '#b8976a', marginBottom: '8px' }}>Template applied!</p>
        <p style={{ fontSize: '13px', color: '#4a4030' }}>Redirecting to project…</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>Select Project</label>
        <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
          <option value="">— Choose a project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={inputStyle}
        />
      </div>
      <button
        onClick={handleApply}
        disabled={applying || !projectId || !startDate}
        style={{ padding: '12px 24px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: applying || !projectId || !startDate ? 0.5 : 1 }}
      >
        {applying ? 'Applying…' : 'Apply Template to Project'}
      </button>
    </div>
  )
}
