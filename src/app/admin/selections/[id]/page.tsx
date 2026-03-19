import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SelectionTemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: template } = await supabase
    .from('selection_templates')
    .select('*, selection_template_items(*)')
    .eq('id', params.id)
    .single()

  if (!template) notFound()

  const items = (template.selection_template_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)

  const grouped = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, address')
    .order('created_at', { ascending: false })

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <Link href="/admin/selections" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Selection Templates</Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8', marginBottom: '4px' }}>{template.name}</h1>
          {template.description && <p style={{ fontSize: '13px', color: '#6a5f50' }}>{template.description}</p>}
          <p style={{ fontSize: '12px', color: '#4a4030', marginTop: '4px' }}>{items.length} total selections · {Object.keys(grouped).length} categories</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(grouped).map(([category, catItems]: [string, any]) => (
            <div key={category} style={card}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#f5f0e8', textTransform: 'uppercase', letterSpacing: '1px' }}>{category}</p>
                <p style={{ fontSize: '11px', color: '#4a4030' }}>{catItems.length} items</p>
              </div>
              <div>
                {catItems.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 20px', borderBottom: '1px solid rgba(184,151,106,0.06)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '13px', color: '#f5f0e8' }}>{item.item_name}</p>
                        {item.requires_signoff && (
                          <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(184,151,106,0.1)', color: '#b8976a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sign-off</span>
                        )}
                      </div>
                      {item.description && <p style={{ fontSize: '11px', color: '#4a4030' }}>{item.description}</p>}
                      <p style={{ fontSize: '10px', color: '#3a3020', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due: {item.due_phase}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Apply to Project</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#6a5f50', marginBottom: '16px' }}>Copy all selections to a project so your client can start making choices.</p>
              <ApplySelectionsForm templateId={params.id} projects={projects ?? []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplySelectionsForm({ templateId, projects }: { templateId: string, projects: any[] }) {
  return (
    <form action={`/api/admin/apply-selections`} method="POST">
      <input type="hidden" name="templateId" value={templateId} />
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }}>Select Project</label>
        <select name="projectId" style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }}>
          <option value="">— Choose a project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
          ))}
        </select>
      </div>
      <Link href={`/admin/selections/${templateId}/apply`} style={{ display: 'block', padding: '10px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
        Apply to Project →
      </Link>
    </div>
  )
}
