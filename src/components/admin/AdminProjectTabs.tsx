'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, daysUntil, SELECTION_STATUS_LABELS } from '@/lib/utils'
import UrgencyBadge from '@/components/shared/UrgencyBadge'
import StatusBadge from '@/components/shared/StatusBadge'
import AdminSelectionManager from './AdminSelectionManager'

const TABS = ['Schedule', 'To-Dos', 'Selections', 'Daily Logs', 'Documents', 'Messaging']

interface Todo {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  subcontractor_id?: string
  created_at: string
  assigned?: { full_name: string; email: string }
  sub?: { id: string; name: string; trade: string }
}

interface DailyLog {
  id: string
  log_date: string
  notes?: string
  photos: string[]
  created_at: string
}

interface Message {
  id: string
  body: string
  created_at: string
  sender_name: string
  sender_role: string
}

interface TeamMember { id: string; full_name: string; email: string }
interface Subcontractor { id: string; name: string; trade: string }

interface Props {
  project: any
  phases: any[]
  selections: any[]
  documents: any[]
  todos: Todo[]
  dailyLogs: DailyLog[]
  messages: Message[]
  team: TeamMember[]
  subcontractors: Subcontractor[]
}

const GOLD = '#b8976a'
const GOLD_LIGHT = 'rgba(184,151,106,0.12)'
const CARD = '#111111'
const BORDER = 'rgba(184,151,106,0.2)'
const TEXT = '#f5f0e8'
const MUTED = '#6a5f50'

const PHASE_COLORS = [
  { bg: '#b8976a', light: 'rgba(184,151,106,0.15)' },
  { bg: '#6a8fb8', light: 'rgba(106,143,184,0.15)' },
  { bg: '#6ab87a', light: 'rgba(106,184,122,0.15)' },
  { bg: '#b86a6a', light: 'rgba(184,106,106,0.15)' },
  { bg: '#9b6ab8', light: 'rgba(155,106,184,0.15)' },
  { bg: '#b8a96a', light: 'rgba(184,169,106,0.15)' },
]

export default function AdminProjectTabs({ project, phases, selections, documents, todos: initialTodos, dailyLogs: initialLogs, messages: initialMessages, team, subcontractors }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState(0)

  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [todoLoading, setTodoLoading] = useState(false)
  const [addingTodo, setAddingTodo] = useState(false)
  const [todoTitle, setTodoTitle] = useState('')
  const [todoSub, setTodoSub] = useState('')
  const [todoAssigned, setTodoAssigned] = useState('')
  const [todoPriority, setTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editForm, setEditForm] = useState({ title: '', status: 'pending' as Todo['status'], priority: 'medium' as Todo['priority'], assigned_to: '', subcontractor_id: '' })

  const [logs, setLogs] = useState<DailyLog[]>(initialLogs)
  const [addingLog, setAddingLog] = useState(false)
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logNotes, setLogNotes] = useState('')
  const [logLoading, setLogLoading] = useState(false)

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [phaseEdits, setPhaseEdits] = useState<Record<string, { depends_on: string; lag_days: number }>>({})
  const [phaseLoading, setPhaseLoading] = useState(false)
  const [localPhases, setLocalPhases] = useState<any[]>(phases)
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
const [phaseEdits, setPhaseEdits] = useState<Record<string, { depends_on: string; lag_days: number }>>({})
const [phaseLoading, setPhaseLoading] = useState(false)
const [localPhases, setLocalPhases] = useState<any[]>(phases)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? GOLD : '#6b7280'
  const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${BORDER}`, fontSize: '13px', background: '#1a1a1a', color: TEXT, outline: 'none' }
  const btnStyle = { padding: '8px 16px', borderRadius: '6px', border: 'none', background: GOLD, color: '#0a0a0a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
  const btnOutline = { padding: '8px 16px', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'none', color: MUTED, fontSize: '13px', cursor: 'pointer' }

  const handleAddTodo = async () => {
    if (!todoTitle.trim()) return
    setTodoLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('todos')
      .insert({ title: todoTitle, status: 'pending', priority: todoPriority, project_id: project.id, assigned_to: todoAssigned || null, subcontractor_id: todoSub || null, created_by: user?.id })
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)')
      .single()
    if (!error && data) setTodos(prev => [data, ...prev])
    setTodoTitle(''); setTodoSub(''); setTodoAssigned(''); setTodoPriority('medium'); setAddingTodo(false)
    setTodoLoading(false)
  }

  const handleToggleTodo = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : 'done'
    const { data } = await supabase.from('todos').update({ status: next }).eq('id', todo.id).select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)').single()
    if (data) setTodos(prev => prev.map(t => t.id === todo.id ? data : t))
  }

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const openEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setEditForm({ title: todo.title, status: todo.status, priority: todo.priority, assigned_to: todo.assigned_to ?? '', subcontractor_id: todo.subcontractor_id ?? '' })
  }

  const handleEditTodo = async () => {
    if (!editingTodo) return
    setTodoLoading(true)
    const { data } = await supabase.from('todos').update({ title: editForm.title, status: editForm.status, priority: editForm.priority, assigned_to: editForm.assigned_to || null, subcontractor_id: editForm.subcontractor_id || null }).eq('id', editingTodo.id).select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)').single()
    if (data) setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
    setEditingTodo(null)
    setTodoLoading(false)
  }

  const handleAddLog = async () => {
    if (!logNotes.trim()) return
    setLogLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('daily_logs')
      .insert({ project_id: project.id, log_date: logDate, notes: logNotes, created_by: user?.id })
      .select().single()
    if (!error && data) setLogs(prev => [data, ...prev])
    setLogNotes(''); setAddingLog(false)
    setLogLoading(false)
  }

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this log entry?')) return
    await supabase.from('daily_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setMsgLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: senderProfile } = await supabase.from('profiles').select('full_name, role').eq('id', user!.id).single()
    const { data, error } = await supabase.from('messages')
      .insert({ project_id: project.id, body: newMessage, sender_id: user?.id, sender_name: senderProfile?.full_name ?? 'Admin', sender_role: 'admin' })
      .select().single()
    if (!error && data) setMessages(prev => [...prev, data])
    setNewMessage('')
    setMsgLoading(false)
  }

  const today = new Date()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' })

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const getPhasesForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day, 12, 0, 0, 0)
    return localPhases.map((phase, idx) => {
      if (!phase.start_date || !phase.end_date) return null
      const start = new Date(phase.start_date); start.setHours(0, 0, 0, 0)
      const end = new Date(phase.end_date); end.setHours(23, 59, 59, 999)
      if (date >= start && date <= end) {
        const isStart = new Date(phase.start_date).toDateString() === date.toDateString()
        const isEnd = new Date(phase.end_date).toDateString() === date.toDateString()
        return { phase, color: PHASE_COLORS[idx % PHASE_COLORS.length], isStart, isEnd }
      }
      return null
    }).filter(Boolean)
  }

  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div>
      <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${GOLD_LIGHT}`, marginBottom: '20px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 500, border: 'none', borderBottom: tab === i ? `2px solid ${GOLD}` : '2px solid transparent', background: 'none', color: tab === i ? GOLD : MUTED, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

     {tab === 0 && (
        <div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {localPhases.map((phase, idx) => (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: PHASE_COLORS[idx % PHASE_COLORS.length].light, border: `1px solid ${PHASE_COLORS[idx % PHASE_COLORS.length].bg}55` }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PHASE_COLORS[idx % PHASE_COLORS.length].bg }} />
                <span style={{ fontSize: '12px', color: TEXT, fontWeight: 500 }}>{phase.name}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '6px 14px', color: MUTED, cursor: 'pointer', fontSize: '16px' }}>←</button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: TEXT, fontWeight: 400, margin: 0 }}>{monthName}</p>
                <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>{currentYear}</p>
              </div>
              <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '6px 14px', color: MUTED, cursor: 'pointer', fontSize: '16px' }}>→</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ padding: '10px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {blanks.map(b => (
                <div key={`blank-${b}`} style={{ minHeight: '110px', borderRight: `1px solid ${GOLD_LIGHT}`, borderBottom: `1px solid ${GOLD_LIGHT}`, background: 'rgba(0,0,0,0.2)' }} />
              ))}
              {calDays.map(day => {
                const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
                const phasesForDay = getPhasesForDay(day) as any[]
                return (
                  <div key={day} style={{ minHeight: '110px', borderRight: `1px solid ${GOLD_LIGHT}`, borderBottom: `1px solid ${GOLD_LIGHT}`, padding: '6px 5px', background: isToday ? 'rgba(184,151,106,0.05)' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? GOLD : MUTED, width: '26px', height: '26px', borderRadius: '50%', background: isToday ? 'rgba(184,151,106,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {day}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {phasesForDay.map((p: any, i: number) => (
                        <div key={i} style={{ background: p.color.bg, borderRadius: '3px', padding: '2px 5px', fontSize: '10px', fontWeight: 700, color: '#0a0a0a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {p.isStart ? p.phase.name : '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phase list */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {localPhases.length === 0 && <p style={{ fontSize: '13px', color: MUTED }}>No phases yet.</p>}
            {localPhases.map((phase, idx) => {
              const color = PHASE_COLORS[idx % PHASE_COLORS.length]
              const isEditing = editingPhase === phase.id
              const dependsOnPhase = localPhases.find(p => p.id === phase.depends_on)
              const edit = phaseEdits[phase.id]

              const handleSavePhase = async () => {
                if (!edit) return
                setPhaseLoading(true)
                const { data } = await supabase
                  .from('project_phases')
                  .update({ depends_on: edit.depends_on || null, lag_days: edit.lag_days })
                  .eq('id', phase.id)
                  .select()
                  .single()
                if (data) setLocalPhases(prev => prev.map(p => p.id === phase.id ? { ...p, depends_on: data.depends_on, lag_days: data.lag_days } : p))
                setEditingPhase(null)
                setPhaseLoading(false)
              }

              return (
                <div key={phase.id} style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '8px', borderLeft: `3px solid ${color.bg}`, overflow: 'hidden' }}>
                  {/* Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{phase.name}</span>
                        <span style={{ fontSize: '11px', color: MUTED }}>{formatDate(phase.start_date)} — {formatDate(phase.end_date)}</span>
                        {dependsOnPhase && (
                          <span style={{ fontSize: '10px', color: GOLD, background: 'rgba(184,151,106,0.12)', border: `1px solid ${GOLD}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            After: {dependsOnPhase.name}{phase.lag_days > 0 ? ` +${phase.lag_days}d` : ''}
                          </span>
                        )}
                        {!dependsOnPhase && phase.lag_days > 0 && (
                          <span style={{ fontSize: '10px', color: MUTED, background: 'rgba(106,95,80,0.12)', border: `1px solid ${MUTED}44`, borderRadius: '4px', padding: '1px 6px' }}>
                            +{phase.lag_days}d lag
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={phase.status} />
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingPhase(null) } else {
                          setEditingPhase(phase.id)
                          setPhaseEdits(prev => ({ ...prev, [phase.id]: { depends_on: phase.depends_on ?? '', lag_days: phase.lag_days ?? 0 } }))
                        }
                      }}
                      style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '5px', padding: '3px 10px', color: isEditing ? GOLD : MUTED, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && edit && (
                    <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${GOLD_LIGHT}`, background: 'rgba(184,151,106,0.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Depends On</p>
                        <select
                          value={edit.depends_on}
                          onChange={e => setPhaseEdits(prev => ({ ...prev, [phase.id]: { ...prev[phase.id], depends_on: e.target.value } }))}
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        >
                          <option value="">None</option>
                          {localPhases.filter(p => p.id !== phase.id).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Lag Days</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => setPhaseEdits(prev => ({ ...prev, [phase.id]: { ...prev[phase.id], lag_days: Math.max(0, prev[phase.id].lag_days - 1) } }))} style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, minWidth: '24px', textAlign: 'center' }}>{edit.lag_days}</span>
                          <button onClick={() => setPhaseEdits(prev => ({ ...prev, [phase.id]: { ...prev[phase.id], lag_days: prev[phase.id].lag_days + 1 } }))} style={{ width: '28px', height: '28px', borderRadius: '5px', border: `1px solid ${BORDER}`, background: 'none', color: TEXT, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                      <button onClick={handleSavePhase} disabled={phaseLoading} style={{ ...btnStyle, padding: '6px 16px', fontSize: '12px' }}>
                        {phaseLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )} 