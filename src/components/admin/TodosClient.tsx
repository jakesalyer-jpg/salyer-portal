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
  assigned?: {
    full_name: string
    email: string
  }
}

interface Project {
  id: string
  name: string
}

interface TeamMember {
  id: string
  full_name: string
  email: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Props {
  todos: Todo[]
  projects: Project[]
  team: TeamMember[]
  profile: Profile
}

export default function TodosClient({ todos: initialTodos, projects, team, profile }: Props) {
  const supabase = createClient()
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssigned, setFilterAssigned] = useState<string>('all')

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

      if (!error && data) {
        setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
      }
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

      if (!error && data) {
        setTodos(prev => [data, ...prev])
      }
    }

    setLoading(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const handleStatusToggle = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : todo.status === 'pending' ? 'in_progress' : 'done'
    const { data, error } = await supabase
      .from('todos')
      .update({ status: next })
      .eq('id', todo.id)
      .select('*, assigned:profiles(full_name, email)')
      .single()

    if (!error && data) {
      setTodos(prev => prev.map(t => t.id === todo.id ? data : t))
    }
  }

  const filteredTodos = todos.filter(t => {
    const statusMatch = filterStatus === 'all' || t.status === filterStatus
    const assignedMatch = filterAssigned === 'all' || t.assigned_to === filterAssigned
    return statusMatch && assignedMatch
  })

  const priorityColor = (p: string) => {
    if (p === 'high') return '#ef4444'
    if (p === 'medium') return '#f59e0b'
    return '#6b7280'
  }

  const statusLabel = (s: string) => {
    if (s === 'in_progress') return 'In Progress'
    if (s === 'done') return 'Done'
    return 'Pending'
  }

  const statusColor = (s: string) => {
    if (s === 'done') return '#10b981'
    if (s === 'in_progress') return '#3b82f6'
    return '#9ca3af'
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Team To-Do</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>{filteredTodos.length} task{filteredTodos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', background: '#fff' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', background: '#fff' }}>
          <option value="all">All Team Members</option>
          {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>{editingTodo ? 'Edit Task' : 'New Task'}</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Task title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Todo['status'] }))}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                <option value="">No Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                <option value="">Unassigned</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              {loading ? 'Saving...' : editingTodo ? 'Save Changes' : 'Add Task'}
            </button>
            <button onClick={resetForm}
              style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Todo List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredTodos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '15px' }}>
            No tasks found. Click &quot;+ New Task&quot; to get started.
          </div>
        )}
        {filteredTodos.map(todo => (
          <div key={todo.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            {/* Status toggle button */}
            <button onClick={() => handleStatusToggle(todo)}
              title="Cycle status"
              style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${statusColor(todo.status)}`, background: todo.status === 'done' ? statusColor(todo.status) : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '600', fontSize: '15px', textDecoration: todo.status === 'done' ? 'line-through' : 'none', color: todo.status === 'done' ? '#9ca3af' : '#111827' }}>
                  {todo.title}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: priorityColor(todo.priority), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {todo.priority}
                </span>
                <span style={{ fontSize: '12px', color: statusColor(todo.status), fontWeight: '500' }}>
                  {statusLabel(todo.status)}
                </span>
              </div>
              {todo.description && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{todo.description}</p>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                {todo.assigned?.full_name && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>👤 {todo.assigned.full_name}</span>
                )}
                {todo.project_id && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>📁 {projects.find(p => p.id === todo.project_id)?.name}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => openEdit(todo)}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(todo.id)}
                style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', color: '#ef4444' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
