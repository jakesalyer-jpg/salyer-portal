import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ApplyTemplateButton from '@/components/admin/ApplyTemplateButton'

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: template } = await supabase
    .from('schedule_templates')
    .select('*, template_phases(*)')
    .eq('id', params.id)
    .single()

  if (!template) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, address')
    .order('created_at', { ascending: false })

  const phases = (template.template_phases ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)

  const totalDays = phases.reduce((sum: number, p: any) => sum + p.duration_days, 0)
  const totalMonths = Math.round(totalDays / 30)

  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Link href="/admin/templates" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Templates</Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8', marginBottom: '4px' }}>{template.name}</h1>
          {template.description && <p style={{ fontSize: '13px', color: '#6a5f50' }}>{template.description}</p>}
          <p style={{ fontSize: '12px', color: '#4a4030', marginTop: '4px' }}>{phases.length} phases · ~{totalMonths} months total</p>
        </div>
        <Link href={`/admin/templates/${params.id}/edit`} style={{ padding: '6px 14px', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', fontSize: '11px', color: '#b8976a', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>Edit</Link>
      </div>

      <div style={{ ...card, overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Phases</p>
        </div>
        {phases.map((phase: any, i: number) => {
          const startDay = phases.slice(0, i).reduce((sum: number, p: any) => sum + p.duration_days, 0)
          return (
            <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.08)' }}>
              <div style={{ width: '4px', height: '44px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: '#f5f0e8', fontWeight: 500, marginBottom: '3px' }}>{phase.name}</p>
                <p style={{ fontSize: '11px', color: '#4a4030' }}>Starts day {startDay + 1} · {phase.duration_days} days</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: '#b8976a' }}>{Math.round(phase.duration_days / 7)} weeks</p>
              </div>
            </div>
          )
        })}
      </div>

      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Apply to Project</p>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#6a5f50', marginBottom: '16px' }}>
            Pick a project and start date — all phases will be created automatically with calculated dates.
          </p>
          <ApplyTemplateButton
            templateId={params.id}
            phases={phases}
            projects={projects ?? []}
          />
        </div>
      </div>
    </div>
  )
}
