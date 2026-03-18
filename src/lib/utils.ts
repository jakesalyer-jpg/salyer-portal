import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM d')
  } catch {
    return '—'
  }
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  try {
    return differenceInDays(parseISO(date), new Date())
  } catch {
    return null
  }
}

export function timeAgo(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function urgencyColor(daysLeft: number | null): string {
  if (daysLeft === null) return 'gray'
  if (daysLeft < 0) return 'red'
  if (daysLeft <= 3) return 'red'
  if (daysLeft <= 14) return 'amber'
  return 'green'
}

export function urgencyLabel(daysLeft: number | null): string {
  if (daysLeft === null) return 'No date'
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return '1 day'
  return `${daysLeft} days`
}

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  contract: 'Contract',
  change_order: 'Change Order',
  plans: 'Plans',
  permit: 'Permit',
  inspection: 'Inspection',
  warranty: 'Warranty',
  invoice: 'Invoice',
  photo: 'Photo',
  other: 'Other',
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  pre_construction: 'Pre-Construction',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
}

export const SELECTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  revision_needed: 'Revision Needed',
}
