'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Todo {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  project_id?: string
  assigned_to?: string
  created_at: string
  assigned?: { full_name: string; email: string }
}

interface Project { id: string; name: string }
interface TeamMember { id: string; full_name: string; email: string }
interface Profile { id: string; full_name: string; email: string; role: string }

interface Props {
  todos: Todo[]
  projects: Project[]
  team: TeamMember[]
  profile: Profile
}

const GOLD = '#C9A84C'
const GOLD_LIGHT = '#F5E6C0'
const GOLD_DARK = '#A07830'
const BG = '#FAF3E0'
const CARD = '#FFF8E7'
const BORDER = '#E8D5A3'

export default function TodosClient({ todos: initialTodos, projects, team, profile }: Props) {
  const supabase = createClient()
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending' as Todo['status'],
    priority: 'medium' as Todo['priority'],
    project_id: '',
    assigned_to: '',
  })

  const resetForm = () => {
    setForm({ title: '', description: '', status: 'pending', priority: 'medium', project_id: '', assigned_to: '' })
    setEditingTodo(null)
    setShowForm(false)
    setErrorMsg(null)
  }

  const openAddForProject = (projectId: string) => {
    resetForm()
    setForm(f => ({ ...f, project_id: projectId }))
    setShowForm(true)
  }

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setForm({
      title: todo.title,
      description: todo.description ?? '',
      status: todo.status,
      priority: todo.priority,
      project_id: todo.project_id ?? '',
      assigned_to: todo.assigned_to ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    setErrorMsg(null)

    if (editingTodo) {
      const { data, error } = await supabase
        .from('todos')
        .update({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          project_id: form.project_id || null,
          assigned_to: form.assigned_to || null,
        })
        .eq('id', editingTodo.id)
        .select('*, assigned:profiles(full_name, email)')
        .single()
      if (error) { setErrorMsg(error.message); setLoading(false); return }
      if (data) setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
    } else {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          project_id: form.project_id || null,
          assigned_to: form.assigned_to || null,
          created_by: profile.id,
        })
        .select('*, assigned:profiles(full_name, email)')
        .single()
      if (error) { setErrorMsg(error.message); setLoading(false); return }
      if (data) setTodos(prev => [data, ...prev])
    }

    setLoading(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const handleToggleDone = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : 'done'
    const { data, error } = await supabase
      .from('todos')
      .update({ status: next })
      .eq('id', todo.id)
      .select('*, assigned:profiles(full_name, email)')
      .single()
    if (!error && data) setTodos(prev => prev.map(t => t.id === todo.id ? data : t))
  }

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? GOLD : '#9ca3af'

  const todosByProject: Record<string, Todo[]> = {}
  const unassignedTodos: Todo[] = []

  todos.forEach(t => {
    if (t.project_id) {
      if (!todosByProject[t.project_id]) todosByProject[t.project_id] = []
      todosByProject[t.project_id].push(t)
    } else {
      unassignedTodos.push(t)
    }
  })

  const totalDone = todos.filter(t => t.status === 'done').length

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#2C1A00', margin: '0 0 4px' }}>Team To-Do</h1>
          <p style={{ color: '#8B6914', margin: 0, fontSize: '14px' }}>{totalDone} of {todos.length} tasks completed</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: GOLD, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', marginBottom: '24px' }}
        >
          + New Task
        </button>

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
            Error: {errorMsg}
          </div>
        )}

        {showForm && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: '700', color: '#2C1A00' }}>
              {editingTodo ? 'Edit Task' : 'New Task'}
            </h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input
                placeholder="Task title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                style={{ padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '15px', background: BG, color: '#2C1A00' }}
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{ padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00', resize: 'vertical' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00' }}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Todo['status'] }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00' }}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00' }}>
                  <option value="">No Job</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00' }}>
                  <option value="">Unassigned</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={handleSubmit} disabled={loading} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                {loading ? 'Saving...' : editingTodo ? 'Save Changes' : 'Add Task'}
              </button>
              <button onClick={resetForm} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* General (unassigned) group */}
        <div style={{ marginBottom: '16px', background: CARD, borderRadius: '14px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: GOLD_LIGHT }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700' }}>G</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#2C1A00' }}>General</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#8B6914' }}>{unassignedTodos.filter(t => t.status === 'done').length}/{unassignedTodos.length} completed</p>
              </div>
            </div>
            <span style={{ background: GOLD, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>
              {unassignedTodos.filter(t => t.status !== 'done').length}
            </span>
          </div>
          <div style={{ padding: '0 16px' }}>
            {unassignedTodos.length === 0 && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet.</p>}
            {unassignedTodos.map(todo => (
              <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                <button onClick={() => handleToggleDone(todo)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', border: `2px solid ${todo.status === 'done' ? GOLD_DARK : GOLD}`, background: todo.status === 'done' ? GOLD_DARK : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {todo.status === 'done' && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500', color: todo.status === 'done' ? '#A09070' : '#2C1A00', textDecoration: todo.status === 'done' ? 'line-through' : 'none' }}>{todo.title}</span>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColor(todo.priority), display: 'inline-block' }} />
                  </div>
                  {todo.description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8B6914' }}>{todo.description}</p>}
                  {todo.assigned?.full_name && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#A07830' }}>Assigned: {todo.assigned.full_name}</p>}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(todo)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: GOLD_DARK }}>Edit</button>
                  <button onClick={() => handleDelete(todo.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>X</button>
                </div>
              </div>
            ))}
            <div onClick={() => openAddForProject('')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
              Add task
            </div>
          </div>
        </div>

        {/* Per-job groups */}
        {projects.map(p => {
          const items = todosByProject[p.id] ?? []
          const done = items.filter(t => t.status === 'done').length
          const isOpen = selectedProject === p.id
          return (
            <div key={p.id} style={{ marginBottom: '16px', background: CARD, borderRadius: '14px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div onClick={() => setSelectedProject(isOpen ? null : p.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: isOpen ? `1px solid ${BORDER}` : 'none', background: GOLD_LIGHT }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700' }}>J</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#2C1A00' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8B6914' }}>{done}/{items.length} completed</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: GOLD, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>{items.length - done}</span>
                  <span style={{ color: GOLD_DARK, fontSize: '18px' }}>{isOpen ? 'v' : '>'}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px' }}>
                  {items.length === 0 && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet.</p>}
                  {items.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                      <button onClick={() => handleToggleDone(todo)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', border: `2px solid ${todo.status === 'done' ? GOLD_DARK : GOLD}`, background: todo.status === 'done' ? GOLD_DARK : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {todo.status === 'done' && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '500', color: todo.status === 'done' ? '#A09070' : '#2C1A00', textDecoration: todo.status === 'done' ? 'line-through' : 'none' }}>{todo.title}</span>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColor(todo.priority), display: 'inline-block' }} />
                        </div>
                        {todo.description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8B6914' }}>{todo.description}</p>}
                        {todo.assigned?.full_name && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#A07830' }}>Assigned: {todo.assigned.full_name}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEdit(todo)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: GOLD_DARK }}>Edit</button>
                        <button onClick={() => handleDelete(todo.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>X</button>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => openAddForProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
                    Add task
                  </div>
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}