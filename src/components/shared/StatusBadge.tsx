interface Props { status: string }

const MAP: Record<string, { label: string; className: string }> = {
  active:         { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:      { label: 'Complete',    className: 'bg-green-50 text-green-700 border-green-200' },
  pending:        { label: 'Upcoming',    className: 'bg-muted text-muted-foreground border-border' },
  on_hold:        { label: 'On Hold',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pre_construction: { label: 'Pre-Construction', className: 'bg-purple-50 text-purple-700 border-purple-200' },
}

export default function StatusBadge({ status }: Props) {
  const entry = MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${entry.className}`}>
      {entry.label}
    </span>
  )
}
