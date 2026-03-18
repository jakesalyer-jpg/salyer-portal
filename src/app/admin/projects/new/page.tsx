'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import Link from 'next/link'

export default function NewProjectPage() {
  const [clients, setClients] = useState<Profile[]>([])
  const [form, setForm] = useState({
    name: '', address: '', client_id: '', status: 'active',
    start_date: '', estimated_completion: '', contract_value: '', description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'client').order('full_name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        ...form,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
        client_id: form.client_id || null,
        created_by: user?.id,
      })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/admin/projects/${data.id}`)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">← All Projects</Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Project Details</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Project Name *</label>
              <input value={form.name} onChange={set('name')} required placeholder="e.g. Johnson Residence" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Address *</label>
              <input value={form.address} onChange={set('address')} required placeholder="e.g. 2847 Salyer Drive, Austin TX 78701" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Client</label>
              <select value={form.client_id} onChange={set('client_id')} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— Select client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="pre_construction">Pre-Construction</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Start Date</label>
              <input type="date" value={form.start_date} onChange={set('start_date')} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Est. Completion</label>
              <input type="date" value={form.estimated_completion} onChange={set('estimated_completion')} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Contract Value ($)</label>
              <input type="number" value={form.contract_value} onChange={set('contract_value')} placeholder="450000" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional project notes…" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Project'}
          </button>
          <Link href="/admin" className="px-6 py-2.5 border border-border text-sm rounded-lg hover:bg-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
