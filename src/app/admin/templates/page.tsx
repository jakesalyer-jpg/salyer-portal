import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TemplatesPage() {
  const supabase = createClient()

  const { data: templates } = await supabase
    .from('schedule_templates')
    .select('*, template_phases(*)')
    .order('created_at', { ascending: false })

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>Schedule Templates</h1>
          <p style={{ fontSize: '13px', color: '#6a5f50', marginTop: '4px' }}>Build once, apply to any project.</p>
        </div>
        <Link href="/admin/templates/new" style={{ padding: '8px 18px', background: '#b8976a', color: '#0a0a0a', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
          + New Template
        </Link>
      </div>

      <div style={card}>
        {!templates?.length ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontFamily: 'Cormorant Garamond, serif', color: '#b8976a', marginBottom: '8px' }}>No templates yet</p>
            <p style={{ fontSize: '13px', color: '#4a4030', marginBottom: '20px' }}>Create your first schedule template to reuse across projects.</p>
            <Link href="/admin/templates/new" style={{ padding: '8px 18px', background: '#b8976a', color: '#0a0a0a', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
              Create Template
            </Link>
          </div>
        ) : (
          <div>
            {templates.map((t: any) => (
              <Link key={t.id} href={`/admin/templates/${t.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(184,151,106,0.08)', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#f5f0e8', marginBottom: '4px' }}>{t.name}</p>
                  <p style={{ fontSize: '12px', color: '#4a4030' }}>{t.template_phases?.length ?? 0} phases</p>
                  {t.description && <p style={{ fontSize: '12px', color: '#4a4030', marginTop: '2px' }}>{t.description}</p>}
                </div>
                <svg style={{ width: '16px', height: '16px', color: '#4a4030' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
