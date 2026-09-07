import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, asc, inArray, count } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/database/client'
import { leagues, rounds, matches, teams, players, matchGoals } from '@/database/schema'
import { RoundManager } from '@/components/admin/RoundManager'
import { Pagination } from '@/components/admin/Pagination'
import { SafeImage } from '@/components/ui/SafeImage'

export const metadata = { title: 'Rodadas — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ liga?: string; page?: string }> }

const homeTeamAlias = alias(teams, 'home_team')
const awayTeamAlias = alias(teams, 'away_team')

export default async function AdminRodadasPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { liga: leagueId, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  // ── Sem liga selecionada: mostra seletor ─────────────────────────────────
  if (!leagueId) {
    const [[{ value: total }], paginatedLeagues] = await Promise.all([
      db.select({ value: count() }).from(leagues),
      db
        .select({ id: leagues.id, name: leagues.name, logoUrl: leagues.logoUrl, tipo: leagues.tipo })
        .from(leagues)
        .orderBy(asc(leagues.name))
        .limit(PAGE_SIZE)
        .offset(offset),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Rodadas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecione uma liga para gerenciar suas rodadas e confrontos
          </p>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma liga cadastrada ainda.</p>
            <Link
              href="/admin/ligas"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Criar liga
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {paginatedLeagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/admin/rodadas?liga=${league.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                      🏆
                    </div>
                    {league.logoUrl && (
                      <SafeImage
                        src={league.logoUrl}
                        alt={league.name}
                        className="absolute inset-0 h-full w-full rounded-xl border border-slate-100 object-contain bg-slate-50 p-0.5"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{league.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {league.tipo === 'grupos' ? 'Por grupos' : 'Pontos corridos'}
                    </p>
                  </div>
                  <svg
                    className="ml-auto h-4 w-4 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath="/admin/rodadas" />
          </>
        )}
      </div>
    )
  }

  // ── Com liga selecionada ─────────────────────────────────────────────────
  const [league] = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      logoUrl: leagues.logoUrl,
      tipo: leagues.tipo,
      numeroGrupos: leagues.numeroGrupos,
    })
    .from(leagues)
    .where(eq(leagues.id, leagueId))

  if (!league) redirect('/admin/rodadas')

  // Rodadas paginadas
  const [[{ value: totalRounds }], roundRows] = await Promise.all([
    db.select({ value: count() }).from(rounds).where(eq(rounds.leagueId, leagueId)),
    db
      .select({
        id: rounds.id,
        numero: rounds.numero,
        nome: rounds.nome,
        grupo: rounds.grupo,
      })
      .from(rounds)
      .where(eq(rounds.leagueId, leagueId))
      .orderBy(asc(rounds.grupo), asc(rounds.numero))
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(totalRounds / PAGE_SIZE)

  // Confrontos apenas das rodadas da página atual
  const roundIds = roundRows.map((r) => r.id)
  const matchRows =
    roundIds.length > 0
      ? await db
          .select({
            id: matches.id,
            roundId: matches.roundId,
            homeTeamId: matches.homeTeamId,
            homeTeamName: homeTeamAlias.name,
            homeTeamLogo: homeTeamAlias.logoUrl,
            awayTeamId: matches.awayTeamId,
            awayTeamName: awayTeamAlias.name,
            awayTeamLogo: awayTeamAlias.logoUrl,
            homeScore: matches.homeScore,
            awayScore: matches.awayScore,
            status: matches.status,
            date: matches.date,
            streamUrl: matches.streamUrl,
          })
          .from(matches)
          .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
          .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
          .where(inArray(matches.roundId, roundIds))
          .orderBy(asc(matches.date))
      : []

  // Times da liga — completo para dropdowns
  const teamRows = await db
    .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl, grupo: teams.grupo })
    .from(teams)
    .where(eq(teams.leagueId, leagueId))
    .orderBy(asc(teams.grupo), asc(teams.name))

  // Jogadores de todos os times da liga — completo para dropdowns
  const teamIds = teamRows.map((t) => t.id)
  const playerRows =
    teamIds.length > 0
      ? await db
          .select({ id: players.id, name: players.name, teamId: players.teamId })
          .from(players)
          .where(inArray(players.teamId, teamIds))
          .orderBy(asc(players.name))
      : []

  // Gols das partidas da página atual
  const matchIds = matchRows.map((m) => m.id)
  const goalRows =
    matchIds.length > 0
      ? await db
          .select({
            matchId: matchGoals.matchId,
            playerId: matchGoals.playerId,
            teamId: matchGoals.teamId,
            goals: matchGoals.goals,
          })
          .from(matchGoals)
          .where(inArray(matchGoals.matchId, matchIds))
      : []

  // Monta rodadas com confrontos aninhados
  const roundsWithMatches = roundRows.map((r) => ({
    ...r,
    matches: matchRows
      .filter((m) => m.roundId === r.id)
      .map((m) => ({
        ...m,
        goals: goalRows.filter((g) => g.matchId === m.id),
      })),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <Link
          href="/admin/rodadas"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Todas as ligas
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              🏆
            </div>
            {league.logoUrl && (
              <SafeImage
                src={league.logoUrl}
                alt={league.name}
                className="absolute inset-0 h-full w-full rounded-xl border border-slate-100 object-contain bg-slate-50 p-0.5"
              />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{league.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {league.tipo === 'grupos'
                ? `Por grupos · ${league.numeroGrupos} grupo${(league.numeroGrupos ?? 0) > 1 ? 's' : ''}`
                : 'Pontos corridos'}
            </p>
          </div>
        </div>
      </div>

      <RoundManager
        league={league}
        rounds={roundsWithMatches}
        teams={teamRows}
        players={playerRows}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/rodadas"
        extraParams={{ liga: leagueId }}
      />
    </div>
  )
}
