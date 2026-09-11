export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { count, eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { leagues, teams } from '@/database/schema'
import { LeagueManager } from '@/components/admin/LeagueManager'
import { LeagueTeamsPanel } from '@/components/admin/LeagueTeamsPanel'
import { Pagination } from '@/components/admin/Pagination'
import { SafeImage } from '@/components/ui/SafeImage'

export const metadata = { title: 'Ligas — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ liga?: string; page?: string }> }

export default async function AdminLigasPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { liga: leagueId, page: pageParam } = await searchParams

  // ── Vista de times de uma liga ─────────────────────────────────────────────
  if (leagueId) {
    const [league] = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        logoUrl: leagues.logoUrl,
        tipo: leagues.tipo,
        numeroGrupos: leagues.numeroGrupos,
      })
      .from(leagues)
      .where(eq(leagues.id, leagueId))

    if (!league) redirect('/admin/ligas')

    const allTeams = await db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl, leagueId: teams.leagueId, grupo: teams.grupo })
      .from(teams)
      .orderBy(teams.name)

    const inLeague = allTeams.filter((t) => t.leagueId === leagueId)
    const outLeague = allTeams.filter((t) => t.leagueId !== leagueId)

    return (
      <div className="py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/admin/ligas"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Todas as ligas
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-emerald-100 text-xl">
                🏆
              </div>
              {league.logoUrl && (
                <SafeImage
                  src={league.logoUrl}
                  alt={league.name}
                  className="absolute inset-0 h-full w-full rounded-lg border border-slate-100 object-contain bg-slate-50 p-0.5"
                />
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-3xl">{league.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">Gerencie os times desta liga</p>
            </div>
          </div>
        </div>

        <LeagueTeamsPanel
          leagueId={leagueId}
          tipo={league.tipo}
          numeroGrupos={league.numeroGrupos}
          inLeague={inLeague}
          outLeague={outLeague}
          noTeams={allTeams.length === 0}
        />
      </div>
    )
  }

  // ── Vista principal: lista + formulário ────────────────────────────────────
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], rows] = await Promise.all([
    db.select({ value: count() }).from(leagues),
    db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        logoUrl: leagues.logoUrl,
        tipo: leagues.tipo,
        numeroGrupos: leagues.numeroGrupos,
        teamCount: count(teams.id),
      })
      .from(leagues)
      .leftJoin(teams, eq(teams.leagueId, leagues.id))
      .groupBy(leagues.id)
      .orderBy(leagues.name)
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-3xl">Ligas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie as competições e seus times participantes
        </p>
      </div>
      <LeagueManager leagues={rows} totalCount={total} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/ligas" />
    </div>
  )
}
