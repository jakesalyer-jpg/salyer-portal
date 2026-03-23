'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Todo {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  project_id?: string
  assigned_to?: string
  subcontractor_id?: string
  created_at: string
  assigned?: { full_name: string; email: string }
  sub?: { id: string; name: string; trade: string }
}

interface Project { id: string; name: string }
interface TeamMember { id: string; full_name: string; email: string }
interface Profile { id: string; full_name: string; email: string; role: string }
interface Subcontractor { id: string; name: string; trade: string }
interface TemplateItem { id: string; phase: string; item: string; order_index: number }

interface Props {
  todos: Todo[]
  projects: Project[]
  team: TeamMember[]
  profile: Profile
  subcontractors: Subcontractor[]
}

const GOLD = '#C9A84C'
const GOLD_LIGHT = '#F5E6C0'
const GOLD_DARK = '#A07830'
const BG = '#FAF3E0'
const CARD = '#FFF8E7'
const BORDER = '#E8D5A3'

export default function TodosClient({ todos: initialTodos, projects, team, profile, subcontractors }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'todos' | 'templates'>('todos')
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [loading, setLoading] = useState(false)
  const [openProject, setOpenProject] = useState<string | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [addingInProject, setAddingInProject] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = useState('')
  const [inlineAssigned, setInlineAssigned] = useState('')
  const [inlineSub, setInlineSub] = useState('')
  const [inlinePriority, setInlinePriority] = useState<Todo['priority']>('medium')
  const [editForm, setEditForm] = useState({
    title: '', status: 'pending' as Todo['status'], priority: 'medium' as Todo['priority'],
    project_id: '', assigned_to: '', subcontractor_id: '',
  })

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [newPhase, setNewPhase] = useState('')
  const [newItem, setNewItem] = useState('')
  const [newItemPhase, setNewItemPhase] = useState('')
  const [applyingTo, setApplyingTo] = useState<string | null>(null)

  useEffect(() => { if (tab === 'templates') loadTemplates() }, [tab])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    const { data } = await supabase.from('checklist_templates').select('*').order('phase').order('order_index')
    if (data) setTemplateItems(data)
    setTemplatesLoading(false)
  }

  const phases = Array.from(new Set(templateItems.map(t => t.phase)))
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
    setInlineSub('')
    setInlinePriority('medium')
    setEditingTodo(null)
  }

  const cancelInlineAdd = () => { setAddingInProject(null); setInlineTitle('') }

  const handleInlineAdd = async (projectId: string) => {
    if (!inlineTitle.trim()) { cancelInlineAdd(); return }
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: inlineTitle, status: 'pending', priority: inlinePriority,
        project_id: projectId || null, assigned_to: inlineAssigned || null,
        subcontractor_id: inlineSub || null, created_by: profile.id,
      })
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)')
      .single()
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    if (data) setTodos(prev => [...prev, data])
    setLoading(false)
    cancelInlineAdd()
  }

  const handleToggleDone = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : 'done'
    const { data, error } = await supabase.from('todos').update({ status: next }).eq('id', todo.id).select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)').single()
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
      title: todo.title, status: todo.status, priority: todo.priority,
      project_id: todo.project_id ?? '', assigned_to: todo.assigned_to ?? '',
      subcontractor_id: todo.subcontractor_id ?? '',
    })
    cancelInlineAdd()
  }

  const handleEditSubmit = async () => {
    if (!editingTodo || !editForm.title.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('todos')
      .update({
        title: editForm.title, status: editForm.status, priority: editForm.priority,
        project_id: editForm.project_id || null, assigned_to: editForm.assigned_to || null,
        subcontractor_id: editForm.subcontractor_id || null,
      })
      .eq('id', editingTodo.id)
      .select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)')
      .single()
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    if (data) setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
    setLoading(false)
    setEditingTodo(null)
  }

  const applyTemplate = async (projectId: string) => {
    if (!confirm('This will add all template checklist items to this job. Continue?')) return
    setApplyingTo(projectId)
    setErrorMsg(null)
    const inserts = templateItems.map(ti => ({
      title: `[${ti.phase}] ${ti.item}`, status: 'pending' as const,
      priority: 'medium' as const, project_id: projectId, created_by: profile.id,
    }))
    const { data, error } = await supabase.from('todos').insert(inserts).select('*, assigned:profiles!todos_assigned_to_fkey(full_name, email), sub:subcontractors(id, name, trade)')
    if (error) { setErrorMsg(error.message) }
    if (data) setTodos(prev => [...prev, ...data])
    setApplyingTo(null)
  }

  const addPhase = async () => {
    if (!newPhase.trim()) return
    setTemplatesLoading(true)
    const { data, error } = await supabase.from('checklist_templates').insert({ phase: newPhase.trim(), item: 'New item', order_index: 0 }).select().single()
    if (!error && data) { setTemplateItems(prev => [...prev, data]); setNewPhase('') }
    setTemplatesLoading(false)
  }

  const addItemToPhase = async (phase: string) => {
    if (!newItem.trim()) return
    const phaseItems = templateItems.filter(t => t.phase === phase)
    const maxOrder = phaseItems.length > 0 ? Math.max(...phaseItems.map(t => t.order_index)) + 1 : 0
    const { data, error } = await supabase.from('checklist_templates').insert({ phase, item: newItem.trim(), order_index: maxOrder }).select().single()
    if (!error && data) { setTemplateItems(prev => [...prev, data]); setNewItem(''); setNewItemPhase('') }
  }

  const deleteTemplateItem = async (id: string) => {
    await supabase.from('checklist_templates').delete().eq('id', id)
    setTemplateItems(prev => prev.filter(t => t.id !== id))
  }

  const moveItem = async (item: TemplateItem, direction: 'up' | 'down') => {
    const phaseItems = templateItems.filter(t => t.phase === item.phase).sort((a, b) => a.order_index - b.order_index)
    const idx = phaseItems.findIndex(t => t.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= phaseItems.length) return
    const swapItem = phaseItems[swapIdx]
    await supabase.from('checklist_templates').update({ order_index: swapItem.order_index }).eq('id', item.id)
    await supabase.from('checklist_templates').update({ order_index: item.order_index }).eq('id', swapItem.id)
    setTemplateItems(prev => prev.map(t => {
      if (t.id === item.id) return { ...t, order_index: swapItem.order_index }
      if (t.id === swapItem.id) return { ...t, order_index: item.order_index }
      return t
    }))
  }

  const SubSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
      <option value="">No Sub</option>
      {subcontractors.map(s => <option key={s.id} value={s.id}>{s.trade} — {s.name}</option>)}
    </select>
  )

  const TodoRow = ({ todo }: { todo: Todo }) => {
    const isDone = todo.status === 'done'
    const isEditing = editingTodo?.id === todo.id
    const teamMember = team.find(m => m.id === todo.assigned_to)

    if (isEditing) return (
      <div style={{ padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleEditSubmit()} autoFocus
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${GOLD}`, fontSize: '15px', background: BG, color: '#2C1A00', marginBottom: '8px', boxSizing: 'border-box' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <SubSelect value={editForm.subcontractor_id} onChange={v => setEditForm(f => ({ ...f, subcontractor_id: v }))} />
          <select value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="">Unassigned</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Todo['status'] }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
            <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="done">Done</option>
          </select>
          <select value={editForm.project_id} onChange={e => setEditForm(f => ({ ...f, project_id: e.target.value }))}
            style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00', gridColumn: 'span 2' }}>
            <option value="">No Job</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleEditSubmit} disabled={loading} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>{loading ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setEditingTodo(null)} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={() => handleDelete(todo.id)} style={{ background: 'none', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>Delete</button>
        </div>
      </div>
    )

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => handleToggleDone(todo)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${isDone ? GOLD_DARK : GOLD}`, background: isDone ? GOLD_DARK : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDone && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>

        <div style={{ width: '150px', flexShrink: 0 }}>
          {todo.sub
            ? <span style={{ fontSize: '12px', fontWeight: '600', color: GOLD_DARK, background: GOLD_LIGHT, borderRadius: '6px', padding: '2px 8px', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.sub.name}</span>
            : <span style={{ fontSize: '12px', color: '#C0A870', fontStyle: 'italic' }}>No sub</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEdit(todo)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: isDone ? '#A09070' : '#2C1A00', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.title}</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor(todo.priority), display: 'inline-block', flexShrink: 0 }} />
            {todo.status === 'in_progress' && <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '1px 5px', fontWeight: '600', flexShrink: 0 }}>In Progress</span>}
          </div>
        </div>

        <div style={{ width: '140px', flexShrink: 0, textAlign: 'right' }}>
          {teamMember
            ? <span style={{ fontSize: '12px', fontWeight: '600', color: '#2C1A00', background: BORDER, borderRadius: '6px', padding: '2px 8px', display: 'inline-block' }}>{teamMember.full_name}</span>
            : <span style={{ fontSize: '12px', color: '#C0A870', fontStyle: 'italic' }}>Unassigned</span>
          }
        </div>
      </div>
    )
  }

  const InlineAddRow = ({ projectId }: { projectId: string }) => (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${GOLD}`, flexShrink: 0 }} />
        <input placeholder="Task title" value={inlineTitle} onChange={e => setInlineTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleInlineAdd(projectId); if (e.key === 'Escape') cancelInlineAdd() }}
          autoFocus style={{ flex: 1, padding: '6px 10px', borderRadius: '7px', border: `1.5px solid ${GOLD}`, fontSize: '15px', background: BG, color: '#2C1A00', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <select value={inlineSub} onChange={e => setInlineSub(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
          <option value="">No Sub</option>
          {subcontractors.map(s => <option key={s.id} value={s.id}>{s.trade} — {s.name}</option>)}
        </select>
        <select value={inlineAssigned} onChange={e => setInlineAssigned(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
          <option value="">Unassigned</option>
          {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <select value={inlinePriority} onChange={e => setInlinePriority(e.target.value as Todo['priority'])}
          style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${BORDER}`, fontSize: '13px', background: BG, color: '#2C1A00' }}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '32px' }}>
        <button onClick={() => handleInlineAdd(projectId)} disabled={loading} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>{loading ? 'Adding...' : 'Add'}</button>
        <button onClick={cancelInlineAdd} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '7px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
      </div>
    </div>
  )

  const JobGroup = ({ projectId, label, items }: { projectId: string; label: string; items: Todo[] }) => {
    const done = items.filter(t => t.status === 'done').length
    const isOpen = openProject === projectId
    const isAdding = addingInProject === projectId
    return (
      <div style={{ marginBottom: '16px', background: CARD, borderRadius: '14px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div onClick={() => setOpenProject(isOpen ? null : projectId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: isOpen ? `1px solid ${BORDER}` : 'none', background: GOLD_LIGHT }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: '22px', flexShrink: 0 }} />
              <div style={{ width: '150px', flexShrink: 0 }}><span style={{ fontSize: '11px', fontWeight: '700', color: '#A07830', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subcontractor</span></div>
              <div style={{ flex: 1 }}><span style={{ fontSize: '11px', fontWeight: '700', color: '#A07830', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</span></div>
              <div style={{ width: '140px', textAlign: 'right', flexShrink: 0 }}><span style={{ fontSize: '11px', fontWeight: '700', color: '#A07830', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</span></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
              <button onClick={() => applyTemplate(projectId)} disabled={applyingTo === projectId || templateItems.length === 0}
                style={{ background: GOLD_DARK, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                {applyingTo === projectId ? 'Applying...' : 'Apply Construction Template'}
              </button>
            </div>
            {items.length === 0 && !isAdding && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet. Apply a template or add manually.</p>}
            {items.map(todo => <TodoRow key={todo.id} todo={todo} />)}
            {isAdding
              ? <InlineAddRow projectId={projectId} />
              : <div onClick={() => startInlineAdd(projectId)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
                  Add task
                </div>
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#2C1A00', margin: '0 0 16px' }}>Team To-Do</h1>
          <div style={{ display: 'flex', gap: '4px', background: GOLD_LIGHT, borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            <button onClick={() => setTab('todos')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', background: tab === 'todos' ? GOLD : 'transparent', color: tab === 'todos' ? '#fff' : GOLD_DARK }}>Todos</button>
            <button onClick={() => setTab('templates')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', background: tab === 'templates' ? GOLD : 'transparent', color: tab === 'templates' ? '#fff' : GOLD_DARK }}>Templates</button>
          </div>
        </div>

        {errorMsg && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>Error: {errorMsg}</div>}

        {tab === 'todos' && (
          <>
            <p style={{ color: '#8B6914', margin: '0 0 20px', fontSize: '14px' }}>{totalDone} of {todos.length} tasks completed</p>
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
                <span style={{ background: GOLD, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>{unassignedTodos.filter(t => t.status !== 'done').length}</span>
              </div>
              <div style={{ padding: '0 16px' }}>
                {unassignedTodos.length === 0 && addingInProject !== 'general' && <p style={{ padding: '14px 0', color: '#B8A070', fontSize: '14px', margin: 0 }}>No tasks yet.</p>}
                {unassignedTodos.map(todo => <TodoRow key={todo.id} todo={todo} />)}
                {addingInProject === 'general'
                  ? <InlineAddRow projectId="" />
                  : <div onClick={() => startInlineAdd('general')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '16px' }}>+</div>
                      Add task
                    </div>
                }
              </div>
            </div>
            {projects.map(p => <JobGroup key={p.id} projectId={p.id} label={p.name} items={todosByProject[p.id] ?? []} />)}
          </>
        )}

        {tab === 'templates' && (
          <div>
            <p style={{ color: '#8B6914', margin: '0 0 20px', fontSize: '14px' }}>Manage your construction checklist template. Changes apply to future jobs.</p>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px', fontWeight: '700', color: '#2C1A00', fontSize: '14px' }}>Add New Phase</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="Phase name (e.g. Roofing)" value={newPhase} onChange={e => setNewPhase(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPhase()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '7px', border: `1.5px solid ${BORDER}`, fontSize: '14px', background: BG, color: '#2C1A00' }} />
                <button onClick={addPhase} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '8px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Add Phase</button>
              </div>
            </div>
            {templatesLoading && <p style={{ color: '#8B6914', fontSize: '14px' }}>Loading...</p>}
            {phases.map(phase => {
              const items = templateItems.filter(t => t.phase === phase).sort((a, b) => a.order_index - b.order_index)
              return (
                <div key={phase} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ background: GOLD_LIGHT, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>{phase.charAt(0)}</span>
                    </div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#2C1A00' }}>{phase}</p>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#8B6914' }}>{items.length} items</span>
                  </div>
                  <div style={{ padding: '0 16px' }}>
                    {items.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button onClick={() => moveItem(item, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D4C5A0' : GOLD_DARK, fontSize: '12px', padding: '0', lineHeight: 1 }}>▲</button>
                          <button onClick={() => moveItem(item, 'down')} disabled={idx === items.length - 1} style={{ background: 'none', border: 'none', cursor: idx === items.length - 1 ? 'default' : 'pointer', color: idx === items.length - 1 ? '#D4C5A0' : GOLD_DARK, fontSize: '12px', padding: '0', lineHeight: 1 }}>▼</button>
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', color: '#2C1A00' }}>{item.item}</span>
                        <button onClick={() => deleteTemplateItem(item.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>Remove</button>
                      </div>
                    ))}
                    {newItemPhase === phase
                      ? <div style={{ display: 'flex', gap: '8px', padding: '10px 0' }}>
                          <input placeholder="New checklist item" value={newItem} onChange={e => setNewItem(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addItemToPhase(phase); if (e.key === 'Escape') setNewItemPhase('') }}
                            autoFocus style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: `1.5px solid ${GOLD}`, fontSize: '14px', background: BG, color: '#2C1A00' }} />
                          <button onClick={() => addItemToPhase(phase)} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 14px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Add</button>
                          <button onClick={() => setNewItemPhase('')} style={{ background: 'none', color: '#8B6914', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '7px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        </div>
                      : <div onClick={() => { setNewItemPhase(phase); setNewItem('') }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', cursor: 'pointer', color: GOLD_DARK, fontSize: '14px', fontWeight: '500' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px dashed ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '14px' }}>+</div>
                          Add item
                        </div>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}