'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Item {
  id: string
  category: string
  item_name: string
  description: string | null
  due_phase: string | null
  requires_signoff: boolean
  sort_order: number
}

interface Project {
  id: string
  name: string
  address: string
}

interface Props {
  template: any
  initialItems: Item[]
  projects: Project[]
}

export default function EditSelectionTemplate({ template, initialItems, projects }: Props) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [items, setItems] = useState<Item[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState(initialItems[0]?.category ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [applying, setApplying] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [appliedSuccess, setAppliedSuccess] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ item_name: '', description: '', due_phase: '', requires_signoff: false })
  const router = useRouter()
  const supabase = createClient()

const categories = items.map(i => i.category).filter((cat, idx, arr) => arr.indexOf(cat) === idx)

  function updateItem(id: string, field: string, value: any) {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  async function deleteItem(id: string) {
    await supabase.from('selection_template_items').delete().eq('id', id)
    setItems(items.filter(item => item.id !== id))
  }

  async function addItem() {
    if (!newItem.item_name) return
    const { data } = await supabase.from('selection_template_items').insert({
      template_id: template.id,
      category: activeCategory,
      item_name: newItem.item_name,
      description: newItem.description || null,
      due_phase: newItem.due_phase || null,
      requires_signoff: newItem.requires_signoff,
      sort_order: items.filter(i => i.category === activeCategory).length * 100 + 50,
    }).select().single()
    if (data) setItems([...items, data])
    setNewItem({ item_name: '', description: '', due_phase: '', requires_signoff: false })
    setAddingItem(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('selection_templates').update({ name, description }).eq('id', template.id)
    for (const item of items) {
      await supabase.from('selection_template_items').update({
        item_name: item.item_name,
        description: item.description,
        due_phase: item.due_phase,
        requires_signoff: item.requires_signoff,
      }).eq('id', item.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleApply() {
    if (!selectedProject) return
    setApplying(true)
    for (const item of items) {
      await supabase.from('selections').insert({
        project_id: selectedProject,
        category: item.category,
        item_name: item.item_name,
        description: item.description,
        deadline: null,
        status: 'pending',
        sort_order: item.sort_order,
      })
    }
    setApplying(false)
    setAppliedSuccess(true)
    setTimeout(() => {
      router.push(`/admin/projects/${selectedProject}`)
    }, 1500)
  }

  const inputStyle = { width: '100%', padding: '8px 12px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '12px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '4px' }
  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ flex: 1, marginRight: '16px' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(184,151,106,0.2)', borderRadius: '0', width: '100%', color: '#f5f0e8', marginBottom: '8px' }}
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Template description..."
            style={{ ...inputStyle, background: 'transparent', border: 'none', padding: '4px 0', color: '#6a5f50', fontSize: '13px' }}
          />
          <p style={{ fontSize: '12px', color: '#4a4030', marginTop: '4px' }}>{items.length} total selections · {categories.length} categories</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: saved ? '#1a4a2a' : '#b8976a', color: saved ? '#70c090' : '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', flexShrink: 0 }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: '16px', alignItems: 'start' }}>

        {/* Category list */}
        <div style={{ ...card, overflow: 'hidden', position: 'sticky', top: '24px' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Categories</p>
          </div>
          {categories.map(cat => {
            const count = items.filter(i => i.category === cat).length
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: activeCategory === cat ? 'rgba(184,151,106,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(184,151,106,0.06)', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: activeCategory === cat ? '#b8976a' : '#6a5f50', lineHeight: 1.3 }}>{cat}</span>
                <span style={{ fontSize: '10px', color: '#3a3020', flexShrink: 0, marginLeft: '4px' }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Items editor */}
        <div style={card}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#f5f0e8' }}>{activeCategory}</p>
            <button onClick={() => setAddingItem(true)} style={{ background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '4px', color: '#b8976a', cursor: 'pointer', fontSize: '11px', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>+ Add Item</button>
          </div>

          {items.filter(i => i.category === activeCategory).map(item => (
            <div key={item.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.06)' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Item Name</label>
                  <input value={item.item_name} onChange={e => updateItem(item.id, 'item_name', e.target.value)} style={inputStyle} />
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: '1px solid rgba(180,60,60,0.2)', borderRadius: '6px', color: '#e07070', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', alignSelf: 'flex-end', flexShrink: 0 }}>Delete</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={item.description ?? ''} onChange={e => updateItem(item.id, 'description', e.target.value)} style={inputStyle} placeholder="Optional description" />
                </div>
                <div>
                  <label style={labelStyle}>Due Phase</label>
                  <input value={item.due_phase ?? ''} onChange={e => updateItem(item.id, 'due_phase', e.target.value)} style={inputStyle} placeholder="e.g. Rough MEP" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6a5f50', cursor: 'pointer' }}>
                <input type="checkbox" checked={item.requires_signoff} onChange={e => updateItem(item.id, 'requires_signoff', e.target.checked)} style={{ accentColor: '#b8976a' }} />
                Requires client sign-off
              </label>
            </div>
          ))}

          {addingItem && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.06)', background: 'rgba(184,151,106,0.03)' }}>
              <p style={{ fontSize: '11px', color: '#b8976a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>New Item</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Item Name *</label>
                  <input value={newItem.item_name} onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} style={inputStyle} placeholder="e.g. Custom Selection" autoFocus />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} style={inputStyle} placeholder="Optional" />
                </div>
                <div>
                  <label style={labelStyle}>Due Phase</label>
                  <input value={newItem.due_phase} onChange={e => setNewItem({ ...newItem, due_phase: e.target.value })} style={inputStyle} placeholder="e.g. Finishes & Trim" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6a5f50', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newItem.requires_signoff} onChange={e => setNewItem({ ...newItem, requires_signoff: e.target.checked })} style={{ accentColor: '#b8976a' }} />
                  Requires sign-off
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={addItem} disabled={!newItem.item_name} style={{ padding: '6px 14px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: !newItem.item_name ? 0.5 : 1 }}>Add</button>
                  <button onClick={() => setAddingItem(false)} style={{ padding: '6px 14px', background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', fontSize: '11px', color: '#6a5f50', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Apply to project panel */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Apply to Project</p>
            </div>
            <div style={{ padding: '20px' }}>
              {appliedSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#b8976a', marginBottom: '6px' }}>Applied!</p>
                  <p style={{ fontSize: '12px', color: '#4a4030' }}>Redirecting to project…</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '12px', color: '#6a5f50', marginBottom: '16px', lineHeight: 1.5 }}>Copy all {items.length} selections to a project. Your client will be able to submit their choices from their portal.</p>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Select Project</label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">— Choose a project —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}
                    </select>
                  </div>
                  <button onClick={handleApply} disabled={applying || !selectedProject} style={{ width: '100%', padding: '10px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: applying || !selectedProject ? 0.5 : 1 }}>
                    {applying ? 'Applying…' : `Apply ${items.length} Selections →`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
