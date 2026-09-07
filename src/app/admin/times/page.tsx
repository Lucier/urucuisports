export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { count } from 'drizzle-orm'
import { db } from '@/database/client'
import { teams } from '@/database/schema'
import { TeamManager } from '@/components/admin/TeamManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Times — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminTimesPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], rows] = await Promise.all([
    db.select({ value: count() }).from(teams),
    db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl })
      .from(teams)
      .orderBy(teams.name)
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Times</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie os times cadastrados no portal</p>
      </div>
      <TeamManager teams={rows} totalCount={total} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/times" />
    </div>
  )
}
