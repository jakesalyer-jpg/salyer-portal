'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency, daysUntil, SELECTION_STATUS_LABELS } from '@/lib/utils'
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
  sender?: { full_name: string; role: string }
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

export default function AdminProjectTabs({ project, phases, selections, documents, todos: initialTodos, dailyLogs: initialLogs, messages: initialMessages, team, subcontractors }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState(0)

  // To-Do state
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [todoLoading, setTodoLoading] = useState(false)
  const [addingTodo, setAddingTodo] = useState(false)
  const [todoTitle, setTodoTitle] = useState('')
  const [todoSub, setTodoSub] = useState('')
  const [todoAssigned, setTodoAssigned] = useState('')
  const [todoPriority, setTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editForm, setEditForm] = useState({ title: '', status: 'pending' as Todo['status'], priority: 'medium' as Todo['priority'], assigned_to: '', subcontractor_id: '' })

  // Daily log state
  const [logs, setLogs] = useState<DailyLog[]>(initialLogs)
  const [addingLog, setAddingLog] = useState(false)
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logNotes, setLogNotes] = useState('')
  const [logLoading, setLogLoading] = useState(false)

  // Messaging state
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? GOLD : '#6b7280'

  // To-Do handlers
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

  // Daily log handlers
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

  // Messaging handlers
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setMsgLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('messages')
      .insert({ project_id: project.id, body: newMessage, sender_id: user?.id })
      .select('*, sender:profiles(full_name, role)').single()
    if (!error && data) setMessages(prev => [...prev, data])
    setNewMessage('')
    setMsgLoading(false)
  }

  const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${BORDER}`, fontSize: '13px', background: '#1a1a1a', color: TEXT, outline: 'none' }
  const btnStyle = { padding: '8px 16px', borderRadius: '6px', border: 'none', background: GOLD, color: '#0a0a0a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
  const btnOutline = { padding: '8px 16px', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'none', color: MUTED, fontSize: '13px', cursor: 'pointer' }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${GOLD_LIGHT}`, marginBottom: '20px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 500, border: 'none', borderBottom: tab === i ? `2px solid ${GOLD}` : '2px solid transparent', background: 'none', color: tab === i ? GOLD : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* SCHEDULE */}
      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {phases.length === 0 && <p style={{ fontSize: '13px', color: MUTED }}>No phases yet.</p>}
          {phases.map((phase: any) => (
            <div key={phase.id} style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${GOLD_LIGHT}`, background: 'rgba(184,151,106,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={phase.status} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{phase.name}</span>
                </div>
                <span style={{ fontSize: '12px', color: MUTED }}>{formatDate(phase.start_date)} — {formatDate(phase.end_date)}</span>
              </div>
              {(phase.tasks ?? []).length === 0
                ? <p style={{ padding: '12px 20px', fontSize: '13px', color: MUTED }}>No tasks.</p>
                : (phase.tasks ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((task: any) => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${task.is_completed ? GOLD : BORDER}`, background: task.is_completed ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {task.is_completed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ fontSize: '13px', color: task.is_completed ? MUTED : TEXT, textDecoration: task.is_completed ? 'line-through' : 'none' }}>{task.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: MUTED, fontFamily: 'monospace' }}>{formatDate(task.due_date)}</span>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}

      {/* TO-DOS */}
      {tab === 1 && (
        <div>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0 10px', borderBottom: `1px solid ${GOLD_LIGHT}`, marginBottom: '4px' }}>
            <div style={{ width: '22px', flexShrink: 0 }} />
            <div style={{ width: '140px', flexShrink: 0 }}><span style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subcontractor</span></div>
            <div style={{ flex: 1 }}><span style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</span></div>
            <div style={{ width: '130px', textAlign: 'right', flexShrink: 0 }}><span style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</span></div>
          </div>

          {todos.length === 0 && !addingTodo && (
            <p style={{ fontSize: '13px', color: MUTED, padding: '16px 0' }}>No tasks yet. Add one below.</p>
          )}

          {todos.map(todo => {
            const isDone = todo.status === 'done'
            const isEditing = editingTodo?.id === todo.id
            const teamMember = team.find(m => m.id === todo.assigned_to)

            if (isEditing) return (
              <div key={todo.id} style={{ padding: '12px 0', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus
                  style={{ ...inputStyle, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <select value={editForm.subcontractor_id} onChange={e => setEditForm(f => ({ ...f, subcontractor_id: e.target.value }))} style={inputStyle}>
                    <option value="">No Sub</option>
                    {subcontractors.map(s => <option key={s.id} value={s.id}>{s.trade} — {s.name}</option>)}
                  </select>
                  <select value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))} style={inputStyle}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Todo['status'] }))} style={inputStyle}>
                    <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="done">Done</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleEditTodo} disabled={todoLoading} style={btnStyle}>{todoLoading ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditingTodo(null)} style={btnOutline}>Cancel</button>
                  <button onClick={() => handleDeleteTodo(todo.id)} style={{ ...btnOutline, color: '#ef4444', borderColor: '#fecaca', marginLeft: 'auto' }}>Delete</button>
                </div>
              </div>
            )

            return (
              <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                <button onClick={() => handleToggleTodo(todo)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${isDone ? GOLD : BORDER}`, background: isDone ? GOLD : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div style={{ width: '140px', flexShrink: 0 }}>
                  {todo.sub
                    ? <span style={{ fontSize: '11px', fontWeight: 600, color: GOLD, background: 'rgba(184,151,106,0.1)', borderRadius: '5px', padding: '2px 7px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{todo.sub.name}</span>
                    : <span style={{ fontSize: '11px', color: MUTED, fontStyle: 'italic' }}>No sub</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEditTodo(todo)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: isDone ? MUTED : TEXT, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.title}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor(todo.priority), flexShrink: 0, display: 'inline-block' }} />
                    {todo.status === 'in_progress' && <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '1px 5px', fontWeight: 600, flexShrink: 0 }}>In Progress</span>}
                  </div>
                </div>
                <div style={{ width: '130px', flexShrink: 0, textAlign: 'right' }}>
                  {teamMember
                    ? <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT, background: 'rgba(184,151,106,0.08)', borderRadius: '5px', padding: '2px 7px', display: 'inline-block' }}>{teamMember.full_name}</span>
                    : <span style={{ fontSize: '11px', color: MUTED, fontStyle: 'italic' }}>Unassigned</span>
                  }
                </div>
              </div>
            )
          })}

          {/* Inline add */}
          {addingTodo ? (
            <div style={{ padding: '12px 0', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${GOLD}`, flexShrink: 0 }} />
                <input placeholder="Task title" value={todoTitle} onChange={e => setTodoTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                  autoFocus style={{ ...inputStyle, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <select value={todoSub} onChange={e => setTodoSub(e.target.value)} style={inputStyle}>
                  <option value="">No Sub</option>
                  {subcontractors.map(s => <option key={s.id} value={s.id}>{s.trade} — {s.name}</option>)}
                </select>
                <select value={todoAssigned} onChange={e => setTodoAssigned(e.target.value)} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <select value={todoPriority} onChange={e => setTodoPriority(e.target.value as Todo['priority'])} style={inputStyle}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px' }}>
                <button onClick={handleAddTodo} disabled={todoLoading} style={btnStyle}>{todoLoading ? 'Adding...' : 'Add'}</button>
                <button onClick={() => { setAddingTodo(false); setTodoTitle('') }} style={btnOutline}>Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setAddingTodo(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: MUTED, fontSize: '14px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
              Add task
            </div>
          )}
        </div>
      )}

      {/* SELECTIONS */}
      {tab === 2 && (
        <AdminSelectionManager projectId={project.id} initialSelections={selections} />
      )}

      {/* DAILY LOGS */}
      {tab === 3 && (
        <div>
          <button onClick={() => setAddingLog(!addingLog)} style={{ ...btnStyle, marginBottom: '16px' }}>
            {addingLog ? 'Cancel' : '+ New Log Entry'}
          </button>

          {addingLog && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', color: MUTED, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: MUTED, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</p>
                <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={4} placeholder="What happened on site today?"
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddLog} disabled={logLoading || !logNotes.trim()} style={btnStyle}>{logLoading ? 'Saving...' : 'Save Log'}</button>
                <button onClick={() => setAddingLog(false)} style={btnOutline}>Cancel</button>
              </div>
            </div>
          )}

          {logs.length === 0 && !addingLog && <p style={{ fontSize: '13px', color: MUTED }}>No daily logs yet.</p>}

          {logs.map(log => (
            <div key={log.id} style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: GOLD, borderRadius: '6px', padding: '4px 10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a' }}>{new Date(log.log_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteLog(log.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
              </div>
              {log.notes && <p style={{ fontSize: '13px', color: TEXT, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{log.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENTS */}
      {tab === 4 && (
        <div style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '10px', overflow: 'hidden' }}>
          {documents.length === 0
            ? <p style={{ padding: '20px', fontSize: '13px', color: MUTED }}>No documents uploaded yet.</p>
            : documents.map((doc: any) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: TEXT }}>{doc.name}</p>
                  <p style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{formatDate(doc.created_at)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: doc.visible_to_client ? '#16a34a' : MUTED }}>{doc.visible_to_client ? 'Client visible' : 'Hidden'}</span>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: GOLD, textDecoration: 'none' }}>View</a>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* MESSAGING */}
      {tab === 5 && (
        <div>
          <div style={{ background: CARD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: '10px', padding: '16px', marginBottom: '12px', minHeight: '300px', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && <p style={{ fontSize: '13px', color: MUTED, textAlign: 'center', margin: 'auto' }}>No messages yet. Start the conversation.</p>}
            {messages.map(msg => {
              const isAdmin = msg.sender?.role === 'admin'
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                  <div style={{ background: isAdmin ? GOLD : '#1a1a1a', borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '10px 14px', maxWidth: '70%', border: isAdmin ? 'none' : `1px solid ${GOLD_LIGHT}` }}>
                    <p style={{ fontSize: '13px', color: isAdmin ? '#0a0a0a' : TEXT, lineHeight: 1.5 }}>{msg.body}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: MUTED }}>{msg.sender?.full_name}</span>
                    <span style={{ fontSize: '11px', color: MUTED }}>·</span>
                    <span style={{ fontSize: '11px', color: MUTED }}>{new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSendMessage} disabled={msgLoading || !newMessage.trim()} style={btnStyle}>
              {msgLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}