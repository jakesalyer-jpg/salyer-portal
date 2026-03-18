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

export default function ScheduleCalendar({ tasks: initialTasks, isAdmin, projectId }: { tasks: Task[], isAdmin: boolean, projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState({ name: '', due_date: '', start_date: '', color: COLORS[0].bg, description: '', depends_on: '' })
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

  async function handleAddTask() {
    if (!newTask.name || !newTask.due_date) return
    setSaving(true)
    const { data } = await supabase.from('tasks')
      .insert({ project_id: projectId, name: newTask.name, due_date: newTask.due_date, start_date: newTask.start_date || null, color: newTask.color, description: newTask.description || null, depends_on: newTask.depends_on || null, is_completed: false })
      .select('*, phase:project_phases(name, status)').single()
    if (data) setTasks([...tasks, data])
    setNewTask({ name: '', due_date: '', start_date: '', color: COLORS[0].bg, description: '', depends_on: '' })
    setShowAddModal(false)
    setSaving(false)
  }

  async function handleToggleComplete(task: Task) {
    const { data } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id).select().single()
    if (data) setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t))
    if (selectedTask?.id === task.id) setSelectedTask({ ...task, is_completed: !task.is_completed })
  }

  async function handleColorChange(task: Task, color: string) {
    await supabase.from('tasks').update({ color }).eq('id', task.id)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, color } : t))
    if (selectedTask?.id === task.id) setSelectedTask({ ...task, color })
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
  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 p-4" style={card}>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: '#b8976a', cursor: 'pointer', fontSize: '16px' }}>‹</button>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#d4b483', minWidth: '180px', textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: '#b8976a', cursor: 'pointer', fontSize: '16px' }}>›</button>
          <button onClick={goToday} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(184,151,106,0.2)', background: 'none', color: '#b8976a', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>Today</button>
        </div>
        <div className="flex items-center gap-2">
          {(['month', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 14px', borderRadius: '4px', border: `1px solid ${view === v ? 'rgba(184,151,106,0.3)' : 'transparent'}`, background: view === v ? 'rgba(184,151,106,0.08)' : 'none', color: view === v ? '#b8976a' : '#4a4030', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{v}</button>
          ))}
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} style={{ padding: '6px 16px', borderRadius: '4px', background: '#b8976a', color: '#0a0a0a', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>+ Add Task</button>
          )}
        </div>
      </div>

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
                      <div style={{ width: isToday ? '22px' : 'auto', height: isToday ? '22px' : 'auto', borderRadius: isToday ? '50%' : '0', background: isToday ? '#b8976a' : 'transparent', color: isToday ? '#0a0a0a' : isWeekend ? '#3a3020' : '#4a4030', fontSize: '11px', fontWeight: isToday ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px', marginLeft: '2px' }}>{day}</div>
                      {dayTasks.map(task => {
                        const c = getColor(task)
                        const start = isStart(task, day)
                        const end = task.due_date?.slice(0,10) === `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                        return (
                          <div key={task.id} onClick={() => setSelectedTask(task)} style={{ background: task.is_completed ? 'rgba(100,100,100,0.3)' : c.bg, color: task.is_completed ? '#555' : c.text, borderRadius: start && end ? '3px' : start ? '3px 0 0 3px' : end ? '0 3px 3px 0' : '0', padding: '2px 5px', fontSize: '10px', fontWeight: 500, marginBottom: '2px', marginLeft: start ? '0' : '-4px', marginRight: end ? '0' : '-4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                            {(start || isSunday(day)) ? task.name : ''}
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

      {view === 'list' && (
        <div style={card}>
          {tasks.length === 0 ? <p style={{ padding: '24px', color: '#4a4030', fontSize: '13px' }}>No tasks yet.</p> : (
            <div>
              {[...tasks].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')).map(task => {
                const c = getColor(task)
                return (
                  <div key={task.id} onClick={() => setSelectedTask(task)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(184,151,106,0.08)', cursor: 'pointer' }}>
                    <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: c.bg, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', color: task.is_completed ? '#4a4030' : '#f5f0e8', textDecoration: task.is_completed ? 'line-through' : 'none' }}>{task.name}</p>
                      {task.phase && <p style={{ fontSize: '11px', color: '#4a4030', marginTop: '2px' }}>{task.phase.name}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {task.start_date && <p style={{ fontSize: '11px', color: '#4a4030' }}>{task.start_date.slice(0,10)}</p>}
                      <p style={{ fontSize: '11px', color: '#6a5f50', fontFamily: 'monospace' }}>{task.due_date?.slice(0,10) ?? '—'}</p>
                    </div>
                    <div style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: task.is_completed ? 'rgba(60,120,80,0.1)' : 'rgba(184,151,106,0.08)', color: task.is_completed ? '#70b080' : '#b8976a', border: `1px solid ${task.is_completed ? 'rgba(60,120,80,0.2)' : 'rgba(184,151,106,0.2)'}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {task.is_completed ? 'Done' : 'Active'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#f5f0e8', marginBottom: '4px' }}>{selectedTask.name}</h2>
                {selectedTask.phase && <p style={{ fontSize: '11px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedTask.phase.name}</p>}
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Start Date', value: selectedTask.start_date?.slice(0,10) ?? '—' },
                { label: 'Due Date', value: selectedTask.due_date?.slice(0,10) ?? '—' },
                { label: 'Status', value: selectedTask.is_completed ? 'Completed' : 'In Progress' },
                { label: 'Depends On', value: selectedTask.depends_on ? tasks.find(t => t.id === selectedTask.depends_on)?.name ?? '—' : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#1a1a1a', borderRadius: '6px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '13px', color: '#f5f0e8' }}>{value}</p>
                </div>
              ))}
            </div>
            {selectedTask.description && (
              <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030', marginBottom: '4px' }}>Notes</p>
                <p style={{ fontSize: '13px', color: '#f5f0e8', lineHeight: 1.5 }}>{selectedTask.description}</p>
              </div>
            )}
            {isAdmin && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a4030', marginBottom: '8px' }}>Color</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLORS.map(c => <button key={c.bg} onClick={() => handleColorChange(selectedTask, c.bg)} style={{ width: '24px', height: '24px', borderRadius: '4px', background: c.bg, border: selectedTask.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleToggleComplete(selectedTask)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(184,151,106,0.2)', background: 'rgba(184,151,106,0.08)', color: '#b8976a', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {selectedTask.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(180,60,60,0.2)', background: 'rgba(180,60,60,0.08)', color: '#e07070', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAddModal && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#f5f0e8' }}>Add Task</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#4a4030', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Task Name *</label>
                <input type="text" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} placeholder="e.g. Roof Trusses" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={newTask.start_date} onChange={e => setNewTask({ ...newTask, start_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <input type="text" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Optional..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Depends On</label>
                <select value={newTask.depends_on} onChange={e => setNewTask({ ...newTask, depends_on: e.target.value })} style={inputStyle}>
                  <option value="">None</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => <button key={c.bg} onClick={() => setNewTask({ ...newTask, color: c.bg })} style={{ width: '28px', height: '28px', borderRadius: '4px', background: c.bg, border: newTask.color === c.bg ? '2px solid #f5f0e8' : '2px solid transparent', cursor: 'pointer' }} />)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={handleAddTask} disabled={saving || !newTask.name || !newTask.due_date} style={{ flex: 1, padding: '10px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding…' : 'Add Task'}
              </button>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#6a5f50', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
