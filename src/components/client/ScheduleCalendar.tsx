'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  name: string
  due_date: string | null
  start_date?: string | null
  is_completed: boolean
  color?: string
  phase?: { name: string; status: string } | null
  description?: string | null
  depends_on?: string | null
  lag_days?: number | null
  work_days?: number | null
}

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

function calcWorkDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function addWorkDays(start: string, workDays: number): string {
  if (!start || workDays <= 0) return start
  const d = new Date(start + 'T00:00:00')
  let count = 0
  while (count < workDays - 1) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
  }
  return d.toISOString().slice(0, 10)
}

export default function ScheduleCalendar({ tasks: initialTasks, isAdmin, projectId }: { tasks: Task[], isAdmin: boolean, projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<{
    name: string
    start_date: string
    due_date: string
    work_days: string
    description: string
    depends_on: string
    lag_days: string
    color: string
    is_completed: boolean
  }>({ name: '', start_date: '', due_date: '', work_days: '', description: '', depends_on: '', lag_days: '0', color: COLORS[0].bg, is_completed: false })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState({ name: '', due_date: '', start_date: '', work_days: '', color: COLORS[0].bg, description: '', depends_on: '', lag_days: '0' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToday() { setCurrentDate(new Date()) }

  function getTasksForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => {
      if (!t.due_date) return false
      const start = (t.start_date || t.due_date).slice(0, 10)
      return dateStr >= start && dateStr <= t.due_date.slice(0, 10)
    })
  }

  function isStart(task: Task, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr === (task.start_date || task.due_date || '').slice(0, 10)
  }

  function isSunday(day: number) { return new Date(year, month, day).getDay() === 0 }

  function getColor(task: Task) {
    return COLORS.find(c => c.bg === task.color) ?? COLORS[3]
  }

  function openTask(task: Task) {
    setSelectedTask(task)
    setEditMode(false)
    setEditForm({
      name: task.name,
      start_date: task.start_date?.slice(0, 10) ?? '',
      due_date: task.due_date?.slice(0, 10) ?? '',
      work_days: task.work_days ? String(task.work_days) : task.start_date && task.due_date ? String(calcWorkDays(task.start_date.slice(0,10), task.due_date.slice(0,10))) : '',
      description: task.description ?? '',
      depends_on: task.depends_on ?? '',
      lag_days: String(task.lag_days ?? 0),
      color: task.color ?? COLORS[3].bg,
      is_completed: task.is_completed,
    })
  }

  // When work days changes, recalc end date
  function handleEditWorkDaysChange(val: string) {
    const wd = parseInt(val)
    if (editForm.start_date && wd > 0) {
      const newEnd = addWorkDays(editForm.start_date, wd)
      setEditForm(f => ({ ...f, work_days: val, due_date: newEnd }))
    } else {
      setEditForm(f => ({ ...f, work_days: val }))
    }
  }

  // When end date changes, recalc work days
  function handleEditEndDateChange(val: string) {
    if (editForm.start_date && val) {
      const wd = calcWorkDays(editForm.start_date, val)
      setEditForm(f => ({ ...f, due_date: val, work_days: String(wd) }))
    } else {
      setEditForm(f => ({ ...f, due_date: val }))
    }
  }

  // When start date changes, recalc end date from work days
  function handleEditStartDateChange(val: string) {
    if (val && editForm.work_days) {
      const wd = parseInt(editForm.work_days)
      if (wd > 0) {
        const newEnd = addWorkDays(val, wd)
        setEditForm(f => ({ ...f, start_date: val, due_date: newEnd }))
        return
      }
    }
    setEditForm(f => ({ ...f, start_date: val }))
  }

  // New task: work days <-> end date sync
  function handleNewWorkDaysChange(val: string) {
    const wd = parseInt(val)
    if (newTask.start_date && wd > 0) {
      const newEnd = addWorkDays(newTask.start_date, wd)
      setNewTask(t => ({ ...t, work_days: val, due_date: newEnd }))
    } else {
      setNewTask(t => ({ ...t, work_days: val }))
    }
  }

  function handleNewEndDateChange(val: string) {
    if (newTask.start_date && val) {
      const wd = calcWorkDays(newTask.start_date, val)
      setNewTask(t => ({ ...t, due_date: val, work_days: String(wd) }))
    } else {
      setNewTask(t => ({ ...t, due_date: val }))
    }
  }

  function handleNewStartDateChange(val: string) {
    if (val && newTask.work_days) {
      const wd = parseInt(newTask.work_days)
      if (wd > 0) {
        const newEnd = addWorkDays(val, wd)
        setNewTask(t => ({ ...t, start_date: val, due_date: newEnd }))
        return
      }
    }
    setNewTask(t => ({ ...t, start_date: val }))
  }

  async function handleSaveEdit() {
    if (!selectedTask) return
    setSaving(true)
    const { data } = await supabase.from('tasks')
      .update({
        name: editForm.name,
        start_date: editForm.start_date || null,
        due_date: editForm.due_date || null,
        work_days: editForm.work_days ? parseInt(editForm.work_days) : null,
        description: editForm.description || null,
        depends_on: editForm.depends_on || null,
        lag_days: parseInt(editForm.lag_days) || 0,
        color: editForm.color,
        is_completed: editForm.is_completed,
      })
      .eq('id', selectedTask.id)
      .select('*, phase:project_phases(name, status)')
      .single()
    if (data) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? data : t))
      setSelectedTask(data)
    }
    setEditMode(false)
    setSaving(false)
  }

  async function handleAddTask() {
    if (!newTask.name || !newTask.due_date) return
    setSaving(true)
    const { data } = await supabase.from('tasks')
      .insert({
        project_id: projectId,
        name: newTask.name,
        due_date: newTask.due_date,
        start_date: newTask.start_date || null,
        work_days: newTask.work_days ? parseInt(newTask.work_days) : null,
        color: newTask.color,
        description: newTask.description || null,
        depends_on: newTask.depends_on || null,
        lag_days: parseInt(newTask.lag_days) || 0,
        is_completed: false,
      })
      .select('*, phase:project_phases(name, status)').single()
    if (data) setTasks([...tasks, data])
    setNewTask({ name: '', due_date: '', start_date: '', work_days: '', color: COLORS[0].bg, description: '', depends_on: '', lag_days: '0' })
    setShowAddModal(false)
    setSaving(false)
  }

  async function handleToggleComplete(task: Task) {
    const { data } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id).select().single()
    if (data) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t))
      if (selectedTask?.id === task.id) setSelectedTask({ ...task, is_completed: !task.is_completed })
    }
  }

  async function handleDeleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(tasks.filter(t => t.id !== taskId))
    setSelectedTask(null)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }
  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }
  const GOLD = '#b8976a'
  const BORDER = 'rgba(184,151,106,0.2)'
  const TEXT = '#f5f0e8'
  const MUTED = '#6a5f50'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4" style={card}>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: GOLD, cursor: 'pointer', fontSize: '16px' }}>‹</button>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#d4b483', minWidth: '180px', textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: GOLD, cursor: 'pointer', fontSize: '16px' }}>›</button>
          <button onClick={goToday} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: GOLD, cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>Today</button>
        </div>
        <div className="flex items-center gap-2">
          {(['month', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 14px', borderRadius: '4px', border: `1px solid ${view === v ? 'rgba(184,151,106,0.3)' : 'transparent'}`, background: view === v ? 'rgba(184,151,106,0.08)' : 'none', color: view === v ? GOLD : '#4a4030', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{v}</button>
          ))}
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} style={{ padding: '6px 16px', borderRadius: '4px', background: GOLD, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>+ Add Task</button>
          )}
        </div>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid rgba(184,151,106,0.1)' }}>
            {DAYS.map(d => <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4a4030' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {cells.map((day, idx) => {
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isWeekend = day ? [0, 6].includes(new Date(year, month, day).getDay()) : false
              const dayTasks = day ? getTasksForDay(day) : []
              return (
                <div key={idx} style={{ minHeight: '90px', borderRight: '1px solid rgba(184,151,106,0.06)', borderBottom: '1px solid rgba(184,151,106,0.06)', padding: '4px', background: isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  {day && (
                    <>
                      <div style={{ width: isToday ? '22px' : 'auto', height: isToday ? '22px' : 'auto', borderRadius: isToday ? '50%' : '0', background: isToday ? GOLD : 'transparent', color: isToday ? '#0a0a0a' : isWeekend ? '#3a3020' : '#4a4030', fontSize: '11px', fontWeight: isToday ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px', marginLeft: '2px' }}>{day}</div>
                      {dayTasks.map(task => {
                        const c = getColor(task)
                        const start = isStart(task, day)
                        const end = task.due_date?.slice(0, 10) === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        return (
 <div key={idx} style={{ minHeight: '90px', borderRight: '1px solid rgba(184,151,106,0.06)', borderBottom: '1px solid rgba(184,151,106,0.06)', padding: '4px', background: isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent' }}>                           {(start || isSunday(day)) ? task.name : ''}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderTop: '1px solid rgba(184,151,106,0.08)', flexWrap: 'wrap' }}>
            {COLORS.map(c => <div key={c.bg} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.bg }} />{c.label}</div>)}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={card}>
          {tasks.length === 0 ? <p style={{ padding: '24px', color: '#4a4030', fontSize: '13px' }}>No tasks yet.</p> : (
            <div>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr 100px 100px 80px 80px', gap: '12px', padding: '8px 16px', borderBottom: '1px solid rgba(184,151,106,0.12)', alignItems: 'center' }}>
                <div />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>Task</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>Start</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>End</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>Work Days</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: MUTED }}>Status</span>
              </div>
              {[...tasks].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')).map(task => {
                const c = getColor(task)
                const wd = task.work_days ?? (task.start_date && task.due_date ? calcWorkDays(task.start_date.slice(0,10), task.due_date.slice(0,10)) : null)
                return (
                  <div key={task.id} onClick={() => openTask(task)} style={{ display: 'grid', gridTemplateColumns: '4px 1fr 100px 100px 80px 80px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(184,151,106,0.08)', cursor: 'pointer', alignItems: 'center' }}>
                    <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: c.bg }} />
                    <div>
                      <p style={{ fontSize: '13px', color: task.is_completed ? '#4a4030' : TEXT, textDecoration: task.is_completed ? 'line-through' : 'none' }}>{task.name}</p>
                      {task.phase && <p style={{ fontSize: '11px', color: '#4a4030', marginTop: '2px' }}>{task.phase.name}</p>}
                      {task.depends_on && <p style={{ fontSize: '10px', color: MUTED, marginTop: '2px' }}>After: {tasks.find(t => t.id === task.depends_on)?.name ?? '—'}{(task.lag_days ?? 0) > 0 ? ` +${task.lag_days}d lag` : ''}</p>}
                    </div>
                    <p style={{ fontSize: '11px', color: '#6a5f50', fontFamily: 'monospace' }}>{task.start_date?.slice(0, 10) ?? '—'}</p>
                    <p style={{ fontSize: '11px', color: '#6a5f50', fontFamily: 'monospace' }}>{task.due_date?.slice(0, 10) ?? '—'}</p>
                    <p style={{ fontSize: '11px', color: MUTED }}>{wd ? `${wd}d` : '—'}</p>
                    <div style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: task.is_completed ? 'rgba(60,120,80,0.1)' : 'rgba(184,151,106,0.08)', color: task.is_completed ? '#70b080' : GOLD, border: `1px solid ${task.is_completed ? 'rgba(60,120,80,0.2)' : BORDER}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {task.is_completed ? 'Done' : 'Active'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Task detail / edit modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: TEXT, marginBottom: '4px' }}>
                  {editMode ? 'Edit Task' : selectedTask.name}
                </h2>
                {selectedTask.phase && !editMode && <p style={{ fontSize: '11px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedTask.phase.name}</p>}
              </div>
              <button onClick={() => { setSelectedTask(null); setEditMode(false) }} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            {/* VIEW MODE */}
            {!editMode && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Start Date', value: selectedTask.start_date?.slice(0, 10) ?? '—' },
                    { label: 'End Date', value: selectedTask.due_date?.slice(0, 10) ?? '—' },
                    { label: 'Work Days', value: selectedTask.work_days ? `${selectedTask.work_days}d` : selectedTask.start_date && selectedTask.due_date ? `${calcWorkDays(selectedTask.start_date.slice(0,10), selectedTask.due_date.slice(0,10))}d` : '—' },
                    { label: 'Status', value: selectedTask.is_completed ? 'Completed' : 'In Progress' },
                    { label: 'Predecessor', value: selectedTask.depends_on ? tasks.find(t => t.id === selectedTask.depends_on)?.name ?? '—' : '—' },
                    { label: 'Lag Days', value: selectedTask.lag_days ? `${selectedTask.lag_days}d` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#1a1a1a', borderRadius: '6px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030', marginBottom: '4px' }}>{label}</p>
                      <p style={{ fontSize: '13px', color: TEXT }}>{value}</p>
                    </div>
                  ))}
                </div>
                {selectedTask.description && (
                  <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030', marginBottom: '4px' }}>Notes</p>
                    <p style={{ fontSize: '13px', color: TEXT, lineHeight: 1.5 }}>{selectedTask.description}</p>
                  </div>
                )}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditMode(true)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'rgba(184,151,106,0.08)', color: GOLD, cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Edit
                    </button>
                    <button onClick={() => handleToggleComplete(selectedTask)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'rgba(184,151,106,0.08)', color: GOLD, cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {selectedTask.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(180,60,60,0.2)', background: 'rgba(180,60,60,0.08)', color: '#e07070', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Delete</button>
                  </div>
                )}
              </>
            )}

            {/* EDIT MODE */}
            {editMode && isAdmin && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Name */}
                  <div>
                    <label style={labelStyle}>Task Name</label>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                  </div>

                  {/* Start / Work Days / End Date */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={editForm.start_date} onChange={e => handleEditStartDateChange(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Work Days</label>
                      <input type="number" min="1" value={editForm.work_days} onChange={e => handleEditWorkDaysChange(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={editForm.due_date} onChange={e => handleEditEndDateChange(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Predecessor + Lag */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Predecessor</label>
                      <select value={editForm.depends_on} onChange={e => setEditForm(f => ({ ...f, depends_on: e.target.value }))} style={inputStyle}>
                        <option value="">None</option>
                        {tasks.filter(t => t.id !== selectedTask.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Lag Days</label>
                      <input type="number" min="0" value={editForm.lag_days} onChange={e => setEditForm(f => ({ ...f, lag_days: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>

                  {/* Color */}
                  <div>
                    <label style={labelStyle}>Color</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {COLORS.map(c => <button key={c.bg} onClick={() => setEditForm(f => ({ ...f, color: c.bg }))} style={{ width: '28px', height: '28px', borderRadius: '4px', background: c.bg, border: editForm.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />)}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="completed" checked={editForm.is_completed} onChange={e => setEditForm(f => ({ ...f, is_completed: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="completed" style={{ fontSize: '13px', color: TEXT, cursor: 'pointer' }}>Mark as completed</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '10px', background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditMode(false)} style={{ padding: '10px 20px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', color: MUTED, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add task modal */}
      {showAddModal && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: TEXT }}>Add Task</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Task Name *</label>
                <input type="text" value={newTask.name} onChange={e => setNewTask(t => ({ ...t, name: e.target.value }))} placeholder="e.g. Roof Trusses" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={newTask.start_date} onChange={e => handleNewStartDateChange(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Work Days</label>
                  <input type="number" min="1" value={newTask.work_days} onChange={e => handleNewWorkDaysChange(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input type="date" value={newTask.due_date} onChange={e => handleNewEndDateChange(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Predecessor</label>
                  <select value={newTask.depends_on} onChange={e => setNewTask(t => ({ ...t, depends_on: e.target.value }))} style={inputStyle}>
                    <option value="">None</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lag Days</label>
                  <input type="number" min="0" value={newTask.lag_days} onChange={e => setNewTask(t => ({ ...t, lag_days: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <input type="text" value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} placeholder="Optional..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => <button key={c.bg} onClick={() => setNewTask(t => ({ ...t, color: c.bg }))} style={{ width: '28px', height: '28px', borderRadius: '4px', background: c.bg, border: newTask.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={handleAddTask} disabled={saving || !newTask.name || !newTask.due_date} style={{ flex: 1, padding: '10px', background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding…' : 'Add Task'}
              </button>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', color: MUTED, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
