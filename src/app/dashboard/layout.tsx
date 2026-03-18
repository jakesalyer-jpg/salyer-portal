import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
```

Then go to `src` → `app` → `dashboard` → `page.tsx` → pencil ✏️ and find this line:
```
if (isAdmin) redirect('/admin')
