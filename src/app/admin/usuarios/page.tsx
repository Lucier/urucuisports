export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/database/client'
import { users } from '@/database/schema'
import { count } from 'drizzle-orm'
import { asc } from 'drizzle-orm'
import { UserManager } from '@/components/admin/UserManager'
import { UserRole } from '@/shared/types/auth'

export const metadata = { title: 'Usuários | Admin | Urucuí Sports' }

export default async function AdminUsuariosPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')

  if (!userId || userRole !== UserRole.ADMIN) redirect('/login')

  const [[{ total }], userRows] = await Promise.all([
    db.select({ total: count() }).from(users),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt)),
  ])

  return (
    <div className="py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Usuários</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie os usuários com acesso ao painel</p>
      </div>

      <UserManager users={userRows} totalCount={total} />
    </div>
  )
}
