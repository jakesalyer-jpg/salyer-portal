'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminMessagesClient({ projects, profile }: { projects: any[], profile: any }) {
  const [selectedProject, setSelectedProject] = useState<any>(projects[0] ?? null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    supabase.from('messages').select('*').eq('project_id', selectedProject.id).order('created_at')
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })
    const channel = supabase.channel(`admin-messages-${selectedProject.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${selectedProject.id}` },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedProject?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProject || !profile) return
    setSending(true)
    await supabase.from('messages').insert({
      project_id: selectedProject.id,
      sender_id: profile.id,
      sender_name: profile.full_name ?? profile.email,
      sender_role: 'admin',
      body: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDay(ts: string) {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' })
  }

  const grouped: { day: string; msgs: any[] }[] = []
  messages.forEach(msg => {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid rgba(184,151,106,0.12)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 400, color: '#f5f0e8' }}>Messages</h1>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedProject(p)} style={{ width: '100%', padding: '14px 16px', background: selectedProject?.id === p.id ? 'rgba(184,151,106,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(184,151,106,0.06)', cursor: 'pointer', textAlign: 'left', borderLeft: selectedProject?.id === p.id ? '2px solid #b8976a' : '2px solid transparent' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#f5f0e8', marginBottom: '3px' }}>{p.name}</p>
              <p style={{ fontSize: '11px', color: '#4a4030' }}>{(p.client as any)?.full_name ?? (p.client as any)?.email ?? 'No client'}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedProject ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#f5f0e8' }}>{selectedProject.name}</p>
            <p style={{ fontSize: '12px', color: '#4a4030' }}>{selectedProject.address}</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {loading ? (
              <p style={{ color: '#4a4030', fontSize: '13px' }}>Loading…</p>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#4a4030', marginBottom: '6px' }}>No messages yet</p>
                <p style={{ fontSize: '12px', color: '#3a3020' }}>Send the first message to your client</p>
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
                    const isMe = msg.sender_role === 'admin'
                    const showName = i === 0 || msgs[i-1]?.sender_id !== msg.sender_id
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
                        {showName && !isMe && (
                          <p style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', marginLeft: '4px' }}>{msg.sender_name}</p>
                        )}
                        <div style={{ maxWidth: '65%' }}>
                          <div style={{ padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#b8976a' : '#1a1a1a', color: isMe ? '#0a0a0a' : '#f5f0e8', fontSize: '13px', lineHeight: 1.5, border: isMe ? 'none' : '1px solid rgba(184,151,106,0.12)' }}>
                            {msg.body}
                          </div>
                          <p style={{ fontSize: '10px', color: '#3a3020', marginTop: '3px', textAlign: isMe ? 'right' : 'left', paddingLeft: '4px', paddingRight: '4px' }}>{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(184,151,106,0.12)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }} placeholder="Message your client… (Enter to send)" rows={1} style={{ flex: 1, padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '8px', color: '#f5f0e8', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'Jost, sans-serif', lineHeight: 1.5 }} />
              <button type="submit" disabled={sending || !newMessage.trim()} style={{ padding: '10px 18px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: sending || !newMessage.trim() ? 0.5 : 1, flexShrink: 0 }}>
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#4a4030', fontSize: '13px' }}>Select a project to view messages</p>
        </div>
      )}
    </div>
  )
}