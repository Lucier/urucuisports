import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SessionKeepAlive } from '@/components/admin/SessionKeepAlive'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
      <SessionKeepAlive />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
