'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: proj } = await supabase.from('projects').select('id, name, address').eq('client_id', user.id).single()
      if (!proj) { setLoading(false); return }
      setProject(proj)

      const { data: msgs } = await supabase.from('messages').select('*').eq('project_id', proj.id).order('created_at')
      setMessages(msgs ?? [])
      setLoading(false)

      // Real-time subscription
      const channel = supabase.channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${proj.id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !project || !profile) return
    setSending(true)
    await supabase.from('messages').insert({
      project_id: project.id,
      sender_id: profile.id,
      sender_name: profile.full_name ?? profile.email,
      sender_role: profile.role,
      body: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDay(ts: string) {
    const d = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' })
  }

  // Group messages by day
  const grouped: { day: string; msgs: any[] }[] = []
  messages.forEach(msg => {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  })

  if (loading) return <div style={{ padding: '32px', color: '#6a5f50', fontSize: '13px' }}>Loading messages…</div>

  if (!project) return (
    <div style={{ padding: '32px', textAlign: 'center' }}>
      <p style={{ color: '#6a5f50', fontSize: '13px' }}>No project found. Contact your builder to get set up.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>Messages</h1>
        <p style={{ fontSize: '13px', color: '#6a5f50', marginTop: '4px' }}>{project.name} · {project.address}</p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px 8px 0 0', padding: '20px', minHeight: '400px', maxHeight: 'calc(100vh - 280px)' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#4a4030' }}>No messages yet</p>
            <p style={{ fontSize: '12px', color: '#3a3020' }}>Start the conversation below</p>
          </div>
        ) : (
          grouped.map(({ day, msgs }) => (
            <div key={day}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(184,151,106,0.1)' }} />
                <span style={{ fontSize: '10px', color: '#3a3020', textTransform: 'uppercase', letterSpacing: '1px' }}>{day}</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(184,151,106,0.1)' }} />
              </div>
              {msgs.map((msg, i) => {
                const isMe = msg.sender_id === profile?.id
                const isAdmin = msg.sender_role === 'admin'
                const showName = i === 0 || msgs[i-1]?.sender_id !== msg.sender_id
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
                    {showName && !isMe && (
                      <p style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', marginLeft: '4px' }}>
                        {msg.sender_name} {isAdmin ? '· Builder' : ''}
                      </p>
                    )}
                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? '#b8976a' : isAdmin ? '#1a3a6b' : '#1a1a1a',
                        color: isMe ? '#0a0a0a' : '#f5f0e8',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        border: isMe ? 'none' : '1px solid rgba(184,151,106,0.12)',
                      }}>
                        {msg.body}
                      </div>
                      <p style={{ fontSize: '10px', color: '#3a3020', marginTop: '3px', marginLeft: '4px', marginRight: '4px' }}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '14px 16px', marginBottom: '24px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '8px', color: '#f5f0e8', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'Jost, sans-serif', lineHeight: 1.5 }}
          />
          <button type="submit" disabled={sending || !newMessage.trim()} style={{ padding: '10px 18px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: sending || !newMessage.trim() ? 0.5 : 1, flexShrink: 0 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
```

Save **Ctrl+S**, close. Now add Messages to the client sidebar. In your command prompt:
```
notepad src\components\shared\Sidebar.tsx
```

Find the `CLIENT_NAV` array and add the Messages link:
```
const CLIENT_NAV = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarIcon },
  { href: '/dashboard/selections', label: 'Selections', icon: SwatchIcon },
  { href: '/dashboard/documents', label: 'Documents', icon: DocumentIcon },
  { href: '/dashboard/updates', label: 'Updates', icon: BellIcon },
  { href: '/dashboard/messages', label: 'Messages', icon: ChatIcon },
]
```

Then add the `ChatIcon` function at the bottom of the file with the other icons:
```
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
}
