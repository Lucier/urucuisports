export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc, count, eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { artilharia, leagues, teams } from '@/database/schema'
import { ArtilhariaManager } from '@/components/admin/ArtilhariaManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Artilharia — Admin | Urucuí Sports' }

const PAGE_SIZE = 20

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminArtilhariaPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [
    [{ value: total }],
    rows,
    allLeagues,
    allTeams,
  ] = await Promise.all([
    db.select({ value: count() }).from(artilharia),
    db
      .select({
        id: artilharia.id,
        nomeJogador: artilharia.nomeJogador,
        leagueId: artilharia.leagueId,
        leagueName: leagues.name,
        teamId: artilharia.teamId,
        teamName: teams.name,
        fotoUrl: artilharia.fotoUrl,
        gols: artilharia.gols,
      })
      .from(artilharia)
      .innerJoin(leagues, eq(artilharia.leagueId, leagues.id))
      .innerJoin(teams, eq(artilharia.teamId, teams.id))
      .orderBy(desc(artilharia.gols))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ id: leagues.id, name: leagues.name }).from(leagues).orderBy(leagues.name),
    db.select({ id: teams.id, name: teams.name, leagueId: teams.leagueId }).from(teams).orderBy(teams.name),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-3xl">Artilharia</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie os artilheiros cadastrados manualmente
        </p>
      </div>
      <ArtilhariaManager
        artilheiros={rows}
        totalCount={total}
        leagues={allLeagues}
        teams={allTeams}
      />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/artilharia" />
    </div>
  )
}
