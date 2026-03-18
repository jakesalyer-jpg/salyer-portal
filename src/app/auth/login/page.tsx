'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, color: '#d4b483', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Salyer Homes
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#4a4030' }}>
            Client Portal
          </div>
        </div>

        <div style={{ background: '#111111', border: '1px solid rgba(184,151,106,0.15)', borderRadius: '8px', padding: '32px' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#6a5f50', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#6a5f50', marginBottom: '8px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '14px', outline: 'none' }}
              />
            </div>
            {error && (
              <div style={{ fontSize: '12px', color: '#e07070', background: 'rgba(180,60,60,0.1)', border: '1px solid rgba(180,60,60,0.2)', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#3a3020', marginTop: '24px' }}>
          Need access? Contact your builder.
        </p>
      </div>
    </div>
  )
}