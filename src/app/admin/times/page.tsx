export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { count, eq, asc } from 'drizzle-orm'
import { db } from '@/database/client'
import { teams, leagues } from '@/database/schema'
import { TeamManager } from '@/components/admin/TeamManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Times — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string; leagueId?: string }> }

export default async function AdminTimesPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam, leagueId } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const whereClause = leagueId ? eq(teams.leagueId, leagueId) : undefined

  const [[{ value: total }], rows, leagueRows] = await Promise.all([
    db.select({ value: count() }).from(teams).where(whereClause),
    db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl })
      .from(teams)
      .where(whereClause)
      .orderBy(teams.name)
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ id: leagues.id, name: leagues.name }).from(leagues).orderBy(asc(leagues.name)),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-3xl">Times</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie os times cadastrados no portal</p>
      </div>
      <TeamManager teams={rows} totalCount={total} leagues={leagueRows} selectedLeagueId={leagueId ?? ''} />
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/times"
        extraParams={leagueId ? { leagueId } : {}}
      />
    </div>
  )
}
