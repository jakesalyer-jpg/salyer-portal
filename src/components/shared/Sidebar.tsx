'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

interface Props { profile: Profile | null }

const CLIENT_NAV = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarIcon },
  { href: '/dashboard/selections', label: 'Selections', icon: SwatchIcon },
  { href: '/dashboard/documents', label: 'Documents', icon: DocumentIcon },
  { href: '/dashboard/updates', label: 'Updates', icon: BellIcon },
]

const ADMIN_NAV = [
  { href: '/admin', label: 'All Projects', icon: HomeIcon },
  { href: '/admin/clients', label: 'Clients', icon: UsersIcon },
  { href: '/admin/subcontractors', label: 'Subcontractors', icon: WrenchIcon },
]

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile?.role === 'admin'
  const nav = isAdmin ? ADMIN_NAV : CLIENT_NAV

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#111111', borderRight: '1px solid rgba(184,151,106,0.12)' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 500, color: '#d4b483', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Salyer Homes
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '6px', marginBottom: '2px',
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px',
              textDecoration: 'none', transition: 'all 0.15s',
              color: active ? '#b8976a' : '#4a4030',
              background: active ? 'rgba(184,151,106,0.08)' : 'transparent',
              border: active ? '1px solid rgba(184,151,106,0.18)' : '1px solid transparent',
            }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(184,151,106,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(184,151,106,0.1)', border: '1px solid rgba(184,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: '#b8976a', flexShrink: 0 }}>
            {getInitials(profile?.full_name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: '#f5f0e8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name ?? 'User'}</p>
            <p style={{ fontSize: '10px', color: '#4a4030', margin: 0, textTransform: 'capitalize' }}>{profile?.role}</p>
          </div>
        </div>
        <button onClick={signOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4a4030' }}>
          <LogOutIcon className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
}
function SwatchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" /></svg>
}
function DocumentIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
}
function WrenchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg>
}
function LogOutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
}