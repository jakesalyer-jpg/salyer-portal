import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditTemplateClient from '@/components/admin/EditTemplateClient'

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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Link href="/admin/templates" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Templates</Link>
      <EditTemplateClient
        template={template}
        initialPhases={phases}
        projects={projects ?? []}
      />
    </div>
  )
}
