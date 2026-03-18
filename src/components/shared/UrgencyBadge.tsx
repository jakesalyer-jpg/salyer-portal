import { urgencyLabel } from '@/lib/utils'

interface Props { days: number | null }

export default function UrgencyBadge({ days }: Props) {
  const label = urgencyLabel(days)
  let cls = 'bg-green-50 text-green-700 border-green-200'
  if (days === null) cls = 'bg-muted text-muted-foreground border-border'
  else if (days < 0) cls = 'bg-red-50 text-red-700 border-red-200'
  else if (days <= 3) cls = 'bg-red-50 text-red-700 border-red-200'
  else if (days <= 14) cls = 'bg-amber-50 text-amber-700 border-amber-200'

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}
