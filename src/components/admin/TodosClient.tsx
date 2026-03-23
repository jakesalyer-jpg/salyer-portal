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
  const [openProject, setOpenProject] = useState<string | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // inline add state
  const [addingInProject, setAddingInProject] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = useState('')
  const [inlineAssigned, setInlineAssigned] = useState('')
  const [inlinePriority, setInlinePriority] = useState<Todo['priority']>('medium')

  // edit form state
  const [editForm, setEditForm] = useState({
    title: '', description: '', status: 'pending' as Todo['status'],
    priority: 'medium' as Todo['priority'], project_id: '', assigned_to: '',
  })

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

  const startInlineAdd = (projectId: string) => {
    setAddingInProject(projectId)
    setInlineTitle('')
    setInlineAssigned('')
    setInlinePriority('medium')
    setEditingTodo(null)
  }

  const cancelInlineAdd = () => {
    setAddingInProject(null)
    setInlineTitle('')
  }

  const handleInlineAdd = async (projectId: string) => {
    if (!inlineTitle.trim()) { cancelInlineAdd(); return }
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: inlineTitle,
        status: 'pending',
        priority: inlinePriority,
        project_id: projectId || null,
        assigned_to: inlineAssigned || null,
        created_by: profile.id,
      })
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email)')
      .single()
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    if (data) setTodos(prev => [...prev, data])
    setLoading(false)
    cancelInlineAdd()
  }

  const handleToggleDone = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : 'done'
    const { data, error } = await supabase
      .from('todos')
      .update({ status: next })
      .eq('id', todo.id)
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email)')
      .single()
    if (!error && data) setTodos(prev => prev.map(t => t.id === todo.id ? data : t))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setEditForm({
      title: todo.title, description: todo.description ?? '',
      status: todo.status, priority: todo.priority,
      project_id: todo.project_id ?? '', assigned_to: todo.assigned_to ?? '',
    })
    cancelInlineAdd()
  }

  const handleEditSubmit = async () => {
    if (!editingTodo || !editForm.title.trim()) return
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase
      .from('todos')
      .update({
        title: editForm.title, description: editForm.description,
        status: editForm.status, priority: editForm.priority,
        project_id: editForm.project_id || null,
        assigned_to: editForm.assigned_to || null,
      })
      .eq('id', editingTodo.id)
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email)')
      .single()
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    if (data) setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
    setLoading(false)
    setEditingTodo(null)
  }

  const TodoRow = ({ todo }: { todo: Todo }) => {
    const isDone = todo.status === 'done'
    const isEditing = editingTodo?.id === todo.id
    if (isEditing) return (
      <div style={{ padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
        <input
          value={editForm.title}
          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleEditSubmit()}
          autoFocus
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${GOLD}`, fontSize: '15px', background: BG, color: '#2C1A00', marginBottom: '8px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Todo['status'] }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="">Unassigned</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          <select value={editForm.project_id} onChange={e => setEditForm(f => ({ ...f, project_id: e.target.value }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="">No Job</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleEditSubmit} disabled={loading} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditingTodo(null)} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            Cancel
          </button>
          <button onClick={() => handleDelete(todo.id)} style={{ background: 'none', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>
            Delete
          </button>
        </div>
      </div>
    )
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => handleToggleDone(todo)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', border: `2px solid ${isDone ? GOLD_DARK : GOLD}`, background: isDone ? GOLD_DARK : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDone && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEdit(todo)}>          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: isDone ? '#A09070' : '#2C1A00', textDecoration: isDone ? 'line-through' : 'none' }}>{todo.title}</span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColor(todo.priority), display: 'inline-block', flexShrink: 0 }} />
            {todo.status === 'in_progress' && <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '1px 6px', fontWeight: '600' }}>In Progress</span>}
          </div>
          {todo.assigned?.full_name && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#A07830' }}>Assigned: {todo.assigned.full_name}</p>}
        </div>
      </div>
    )
  }

  const InlineAddRow = ({ projectId }: { projectId: string }) => (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${GOLD}`, flexShrink: 0 }} />
        <input
          placeholder="Task title"
          value={inlineTitle}
          onChange={e => setInlineTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleInlineAdd(projectId); if (e.key === 'Escape') cancelInlineAdd() }}
          autoFocus
          style={{ flex: 1, padding: '6px 10px', borderRadius: '7px', border: `1.5px solid ${GOLD}`, fontSize: '15px', background: BG, color: '#2C1A00', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px', marginBottom: '8px' }}>
        <select value={inlinePriority} onChange={e => setInlinePriority(e.target.value as Todo['priority'])}
          style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={inlineAssigned} onChange={e => setInlineAssigned(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
          <option value="">Unassigned</option>
          {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px' }}>
        <button onClick={() => handleInlineAdd(projectId)} disabled={loading} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
          {loading ? 'Adding...' : 'Add'}
        </button>
        <button onClick={cancelInlineAdd} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
          Cancel
        </button>
      </div>
    </div>
  )

  const JobGroup = ({ projectId, label, items }: { projectId: string; label: string; items: Todo[] }) => {
    const done = items.filter(t => t.status === 'done').length
    const isOpen = openProject === projectId
    const isAdding = addingInProject === projectId
    return (
      <div style={{ marginBottom: '16px', background: CARD, borderRadius: '14px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div onClick={() => { setOpenProject(isOpen ? null : projectId); if (!isOpen) startInlineAdd(projectId) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: isOpen ? `1px solid ${BORDER}` : 'none', background: GOLD_LIGHT }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700' }}>{label.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#2C1A00' }}>{label}</p>
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
            {items.length === 0 && !isAdding && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet.</p>}
            {items.map(todo => <TodoRow key={todo.id} todo={todo} />)}
            {isAdding
              ? <InlineAddRow projectId={projectId} />
              : (
                <div onClick={() => startInlineAdd(projectId)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
                  Add task
                </div>
              )
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#2C1A00', margin: '0 0 4px' }}>Team To-Do</h1>
          <p style={{ color: '#8B6914', margin: 0, fontSize: '14px' }}>{totalDone} of {todos.length} tasks completed</p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
            Error: {errorMsg}
          </div>
        )}

        {/* General group */}
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
            {unassignedTodos.length === 0 && addingInProject !== 'general' && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet.</p>}
            {unassignedTodos.map(todo => <TodoRow key={todo.id} todo={todo} />)}
            {addingInProject === 'general'
              ? <InlineAddRow projectId="" />
              : (
                <div onClick={() => startInlineAdd('general')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
                  Add task
                </div>
              )
            }
          </div>
        </div>

        {/* Job groups */}
        {projects.map(p => (
          <JobGroup key={p.id} projectId={p.id} label={p.name} items={todosByProject[p.id] ?? []} />
        ))}

      </div>
    </div>
  )
}