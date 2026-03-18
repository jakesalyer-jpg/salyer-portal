'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InviteClientPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, phone }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-12">
        <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Invitation sent!</h2>
        <p className="text-sm text-muted-foreground mb-6">{fullName || email} will receive an email to set up their account.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/admin/clients" className="px-4 py-2 bg-brand text-white text-sm rounded-lg">View Clients</Link>
          <button onClick={() => { setSuccess(false); setEmail(''); setFullName(''); setPhone('') }} className="px-4 py-2 border border-border text-sm rounded-lg">Invite Another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/admin/clients" className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">← Clients</Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Invite Client</h1>

      <div className="bg-card border border-border rounded-xl p-5">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Email Address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="client@example.com" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jennifer Johnson" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          <p className="text-xs text-muted-foreground">The client will receive an email to set their password and access their project portal.</p>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50">
            {loading ? 'Sending invite…' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}
