'use client'

import { useState } from 'react'
import { formatDate, daysUntil, DOCUMENT_CATEGORY_LABELS, SELECTION_STATUS_LABELS } from '@/lib/utils'
import UrgencyBadge from '@/components/shared/UrgencyBadge'
import StatusBadge from '@/components/shared/StatusBadge'
import AdminAnnouncementForm from './AdminAnnouncementForm'
import AdminSelectionManager from './AdminSelectionManager'

const TABS = ['Phases & Tasks', 'Selections', 'Documents', 'Announcements']

interface Props {
  project: any
  phases: any[]
  selections: any[]
  documents: any[]
  announcements: any[]
}

export default function AdminProjectTabs({ project, phases, selections, documents, announcements }: Props) {
  const [tab, setTab] = useState(0)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border mb-4">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === i
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Phases & Tasks */}
      {tab === 0 && (
        <div className="space-y-4">
          {phases.length === 0 && <p className="text-sm text-muted-foreground">No phases yet.</p>}
          {phases.map((phase: any) => (
            <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/40">
                <div className="flex items-center gap-3">
                  <StatusBadge status={phase.status} />
                  <span className="text-sm font-semibold">{phase.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(phase.start_date)} — {formatDate(phase.end_date)}</span>
              </div>
              {(phase.tasks ?? []).length === 0 ? (
                <p className="px-5 py-3 text-sm text-muted-foreground">No tasks.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(phase.tasks ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${task.is_completed ? 'bg-brand border-brand' : 'border-border'}`}>
                          {task.is_completed && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{formatDate(task.due_date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selections */}
      {tab === 1 && (
        <AdminSelectionManager projectId={project.id} initialSelections={selections} />
      )}

      {/* Documents */}
      {tab === 2 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {documents.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {DOCUMENT_CATEGORY_LABELS[doc.category]} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${doc.visible_to_client ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'}`}>
                      {doc.visible_to_client ? 'Client visible' : 'Hidden'}
                    </span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">View</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements */}
      {tab === 3 && (
        <AdminAnnouncementForm projectId={project.id} initialAnnouncements={announcements} />
      )}
    </div>
  )
}
