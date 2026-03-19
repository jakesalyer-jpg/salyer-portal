import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditSelectionTemplate from '@/components/admin/EditSelectionTemplate'

export default async function SelectionTemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: template } = await supabase
    .from('selection_templates')
    .select('*, selection_template_items(*)')
    .eq('id', params.id)
    .single()

  if (!template) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, address')
    .order('created_at', { ascending: false })

  const items = (template.selection_template_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Link href="/admin/selections" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Selection Templates</Link>
      <EditSelectionTemplate template={template} initialItems={items} projects={projects ?? []} />
    </div>
  )
}
