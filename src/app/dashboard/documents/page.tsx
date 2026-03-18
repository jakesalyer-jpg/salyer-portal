import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, DOCUMENT_CATEGORY_LABELS } from '@/lib/utils'
import type { Document } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📄',
  change_order: '✏️',
  plans: '📐',
  permit: '🏛️',
  inspection: '✅',
  warranty: '🛡️',
  invoice: '💰',
  photo: '📸',
  other: '📁',
}

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, address')
    .eq('client_id', user.id)
    .single()

  if (!project) return <div className="p-8 text-muted-foreground text-sm">No project found.</div>

  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false })

  const documents = (data ?? []) as Document[]

  const grouped = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {})

  const categoryOrder = ['contract', 'change_order', 'plans', 'permit', 'inspection', 'warranty', 'invoice', 'photo', 'other']
  const sortedCategories = categoryOrder.filter((c) => grouped[c])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">All contracts, plans, permits, and reports for your project.</p>
      </div>

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}

      <div className="space-y-4">
        {sortedCategories.map((cat) => (
          <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/50">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>{CATEGORY_ICONS[cat]}</span>
                {DOCUMENT_CATEGORY_LABELS[cat]}
                <span className="text-xs font-normal text-muted-foreground">({grouped[cat].length})</span>
              </h2>
            </div>
            <div className="divide-y divide-border">
              {grouped[cat].map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.file_type?.toUpperCase()} · Uploaded {formatDate(doc.created_at)}
                      {doc.file_size && ` · ${(doc.file_size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                    )}
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
