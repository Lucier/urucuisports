import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { desc, eq, count, asc, and, gte, lt, inArray, sql, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/database/client'
import {
  posts,
  matches,
  teams,
  players,
  leagues,
  photoAlbums,
  streams,
  categories,
  users,
  topScorers,
} from '@/database/schema'
import { usersRepository } from '@/modules/users/repository'
import { UserRole } from '@/shared/types/auth'
import { LeagueSelect } from './LeagueSelect'

export const metadata = { title: 'Dashboard | Urucuí Sports' }

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
  color = 'slate',
  icon,
}: {
  label: string
  value: number
  href?: string
  color?: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'slate'
  icon: React.ReactNode
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky:     'bg-sky-50 text-sky-600 border-sky-100',
    violet:  'bg-violet-50 text-violet-600 border-violet-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    slate:   'bg-slate-50 text-slate-600 border-slate-100',
  }

  const card = (
    <div className={`flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition ${href ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value.toLocaleString('pt-BR')}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )

  return href ? <Link href={href}>{card}</Link> : <div>{card}</div>
}

// ─── Standings table ──────────────────────────────────────────────────────────

type StandingRow = {
  id: string
  team_name: string
  grupo: number | null
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="w-8 px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Time</th>
            <th className="px-4 py-3 text-center font-bold text-slate-700" title="Pontos">PTS</th>
            <th className="px-3 py-3 text-center" title="Partidas Jogadas">PJ</th>
            <th className="px-3 py-3 text-center" title="Vitórias">V</th>
            <th className="px-3 py-3 text-center" title="Empates">E</th>
            <th className="px-3 py-3 text-center" title="Derrotas">D</th>
            <th className="px-3 py-3 text-center" title="Gols Marcados">GM</th>
            <th className="px-3 py-3 text-center" title="Gols Contra">GC</th>
            <th className="px-3 py-3 text-center" title="Saldo de Gols">SG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => {
            const sg = row.goals_for - row.goals_against
            return (
              <tr key={row.id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-bold text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{row.team_name}</td>
                <td className="px-4 py-3 text-center text-base font-extrabold text-slate-900">{row.points}</td>
                <td className="px-3 py-3 text-center text-slate-600">{row.played}</td>
                <td className="px-3 py-3 text-center font-medium text-emerald-700">{row.won}</td>
                <td className="px-3 py-3 text-center text-slate-600">{row.drawn}</td>
                <td className="px-3 py-3 text-center text-slate-600">{row.lost}</td>
                <td className="px-3 py-3 text-center text-slate-600">{row.goals_for}</td>
                <td className="px-3 py-3 text-center text-slate-600">{row.goals_against}</td>
                <td className="px-3 py-3 text-center font-medium text-slate-700">
                  {sg > 0 ? `+${sg}` : sg}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string }>
}) {
  const { leagueId } = await searchParams
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')

  if (!userId) redirect('/login')

  const user = await usersRepository.findById(userId)
  if (!user) redirect('/login')

  const isAdmin = userRole === UserRole.ADMIN

  const homeTeamAlias = alias(teams, 'home_team')
  const awayTeamAlias = alias(teams, 'away_team')

  const [
    [postCount],
    [matchCount],
    [teamCount],
    [playerCount],
    [leagueCount],
    [albumCount],
    [streamCount],
    matchStatusCounts,
    recentMatches,
    recentPosts,
    leagueList,
    leagueTopScorers,
  ] = await Promise.all([
    db.select({ total: count() }).from(posts),
    db.select({ total: count() }).from(matches),
    db.select({ total: count() }).from(teams),
    db.select({ total: count() }).from(players),
    db.select({ total: count() }).from(leagues),
    db.select({ total: count() }).from(photoAlbums),
    db.select({ total: count() }).from(streams),

    db
      .select({ status: matches.status, total: count() })
      .from(matches)
      .groupBy(matches.status),

    (() => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const tomorrowStart = new Date(todayStart)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)

      const todayFilter = and(
        gte(matches.date, todayStart),
        lt(matches.date, tomorrowStart),
        inArray(matches.status, ['LIVE', 'SCHEDULED', 'FINISHED']),
        leagueId ? eq(matches.leagueId, leagueId) : undefined,
      )

      return db
        .select({
          id: matches.id,
          homeTeamName: homeTeamAlias.name,
          awayTeamName: awayTeamAlias.name,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          status: matches.status,
          date: matches.date,
        })
        .from(matches)
        .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
        .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
        .where(todayFilter)
        .orderBy(
          sql`CASE ${matches.status} WHEN 'LIVE' THEN 1 WHEN 'SCHEDULED' THEN 2 WHEN 'FINISHED' THEN 3 ELSE 4 END`,
          asc(matches.date),
        )
        .limit(5)
    })(),

    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        categoryName: categories.name,
        createdAt: posts.createdAt,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(5),

    db
      .select({ id: leagues.id, name: leagues.name, tipo: leagues.tipo })
      .from(leagues)
      .orderBy(asc(leagues.name)),

    db
      .select({
        id: topScorers.id,
        playerName: topScorers.playerName,
        teamName: teams.name,
        goals: topScorers.goals,
        assists: topScorers.assists,
      })
      .from(topScorers)
      .leftJoin(teams, eq(topScorers.teamId, teams.id))
      .where(leagueId ? eq(topScorers.leagueId, leagueId) : sql`false`)
      .orderBy(desc(topScorers.goals), desc(topScorers.assists))
      .limit(5),
  ])

  const selectedLeague = leagueList.find((l) => l.id === leagueId)
  const isGrouped = selectedLeague?.tipo === 'grupos'

  let leagueStandings: StandingRow[] = []
  if (leagueId) {
    const [leagueTeams, finishedMatches] = await Promise.all([
      db
        .select({ id: teams.id, name: teams.name, grupo: teams.grupo })
        .from(teams)
        .where(eq(teams.leagueId, leagueId)),
      db
        .select({
          homeTeamId: matches.homeTeamId,
          awayTeamId: matches.awayTeamId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
        })
        .from(matches)
        .where(and(eq(matches.leagueId, leagueId), eq(matches.status, 'FINISHED'))),
    ])

    const map = new Map<string, StandingRow>()
    for (const t of leagueTeams) {
      map.set(t.id, { id: t.id, team_name: t.name, grupo: t.grupo, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 })
    }

    for (const m of finishedMatches) {
      if (m.homeScore === null || m.awayScore === null) continue
      const home = map.get(m.homeTeamId)
      const away = map.get(m.awayTeamId)
      if (home) {
        home.played++
        home.goals_for += m.homeScore
        home.goals_against += m.awayScore
        if (m.homeScore > m.awayScore) { home.won++; home.points += 3 }
        else if (m.homeScore === m.awayScore) { home.drawn++; home.points++ }
        else { home.lost++ }
      }
      if (away) {
        away.played++
        away.goals_for += m.awayScore
        away.goals_against += m.homeScore
        if (m.awayScore > m.homeScore) { away.won++; away.points += 3 }
        else if (m.homeScore === m.awayScore) { away.drawn++; away.points++ }
        else { away.lost++ }
      }
    }

    leagueStandings = [...map.values()]
      .filter((s) => s.played > 0)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        const sgA = a.goals_for - a.goals_against
        const sgB = b.goals_for - b.goals_against
        if (sgB !== sgA) return sgB - sgA
        return b.goals_for - a.goals_for
      })
  }

  const statusMap = Object.fromEntries(
    matchStatusCounts.map((r) => [r.status, r.total]),
  )

  const liveCount      = statusMap['LIVE']      ?? 0
  const finishedCount  = statusMap['FINISHED']  ?? 0
  const scheduledCount = statusMap['SCHEDULED'] ?? 0

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: 'Agendado',  cls: 'bg-slate-100 text-slate-600' },
    LIVE:      { label: 'Ao vivo',   cls: 'bg-red-100 text-red-700' },
    FINISHED:  { label: 'Encerrado', cls: 'bg-emerald-100 text-emerald-700' },
    POSTPONED: { label: 'Adiado',    cls: 'bg-amber-100 text-amber-700' },
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Olá, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aqui está um resumo geral da aplicação
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Notícias"
          value={postCount.total}
          href={isAdmin ? '/admin/noticias' : '/noticias'}
          color="emerald"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          }
        />
        <StatCard
          label="Partidas"
          value={matchCount.total}
          href={isAdmin ? '/admin/rodadas' : undefined}
          color="sky"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Times"
          value={teamCount.total}
          href={isAdmin ? '/admin/times' : undefined}
          color="violet"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Jogadores"
          value={playerCount.total}
          href={isAdmin ? '/admin/jogadores' : undefined}
          color="amber"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="Ligas"
          value={leagueCount.total}
          href={isAdmin ? '/admin/ligas' : '/estatisticas'}
          color="rose"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="Álbuns de fotos"
          value={albumCount.total}
          href={isAdmin ? '/admin/fotos' : '/fotos'}
          color="slate"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Transmissões"
          value={streamCount.total}
          href={isAdmin ? '/admin/transmissoes' : '/transmissoes'}
          color="slate"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Mini status das partidas */}
        <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-1 lg:col-span-1">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
            <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium text-slate-500">Status das partidas</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              {liveCount > 0 && (
                <span className="font-semibold text-red-600">● {liveCount} ao vivo</span>
              )}
              <span className="text-slate-500">{scheduledCount} agendadas</span>
              <span className="text-slate-500">{finishedCount} encerradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classificação por liga */}
      <section className="mb-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">Classificação</h2>
          <LeagueSelect leagues={leagueList} selectedId={leagueId} />
        </div>

        {!leagueId ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Selecione uma liga para ver a classificação.
          </p>
        ) : leagueStandings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Nenhum dado de classificação cadastrado para esta liga.
          </p>
        ) : isGrouped ? (
          // Exibe uma tabela por grupo
          (() => {
            const groupMap = new Map<number, StandingRow[]>()
            for (const row of leagueStandings) {
              const g = row.grupo ?? 1
              if (!groupMap.has(g)) groupMap.set(g, [])
              groupMap.get(g)!.push(row)
            }
            const sortedGroups = [...groupMap.entries()].sort(([a], [b]) => a - b)
            return (
              <div className="divide-y divide-slate-100">
                {sortedGroups.map(([groupNum, rows]) => (
                  <div key={groupNum}>
                    <p className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                      Grupo {groupNum}
                    </p>
                    <StandingsTable rows={rows} />
                  </div>
                ))}
              </div>
            )
          })()
        ) : (
          <StandingsTable rows={leagueStandings} />
        )}
      </section>

      {/* Conteúdo principal: partidas + notícias */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Partidas recentes */}
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Partidas recentes</h2>
              {selectedLeague && (
                <p className="mt-0.5 text-[11px] text-slate-400">{selectedLeague.name}</p>
              )}
            </div>
            {isAdmin && (
              <Link href="/admin/rodadas" className="text-xs font-medium text-emerald-600 hover:underline">
                Gerenciar →
              </Link>
            )}
          </div>
          {recentMatches.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              {selectedLeague ? `Nenhuma partida encontrada para ${selectedLeague.name}.` : 'Nenhuma partida cadastrada.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentMatches.map((m) => {
                const badge = STATUS_LABEL[m.status] ?? STATUS_LABEL.SCHEDULED
                const showScore = m.homeScore !== null && m.awayScore !== null
                return (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    {/* Casa */}
                    <span className="min-w-0 flex-1 truncate text-right text-xs font-medium text-slate-700">
                      {m.homeTeamName ?? '—'}
                    </span>

                    {/* Placar */}
                    <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
                      {showScore ? (
                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {m.homeScore} × {m.awayScore}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(m.date))}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Visitante */}
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                      {m.awayTeamName ?? '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Artilharia */}
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Artilharia</h2>
              {selectedLeague && (
                <p className="mt-0.5 text-[11px] text-slate-400">{selectedLeague.name}</p>
              )}
            </div>
            <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          {!selectedLeague ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Selecione uma liga para ver a artilharia.
            </p>
          ) : leagueTopScorers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhum artilheiro cadastrado para esta liga.
            </p>
          ) : (
            <ol className="divide-y divide-slate-50">
              {leagueTopScorers.map((scorer, i) => (
                <li key={scorer.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
                    ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{scorer.playerName}</p>
                    {scorer.teamName && (
                      <p className="truncate text-[11px] text-slate-400">{scorer.teamName}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="text-base font-extrabold tabular-nums text-slate-900">{scorer.goals}</p>
                      <p className="text-[10px] text-slate-400">gols</p>
                    </div>
                    {scorer.assists > 0 && (
                      <div>
                        <p className="text-sm font-bold tabular-nums text-slate-500">{scorer.assists}</p>
                        <p className="text-[10px] text-slate-400">assist.</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Notícias recentes */}
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">Notícias recentes</h2>
            <Link href="/noticias" className="text-xs font-medium text-emerald-600 hover:underline">
              Ver todas →
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhuma notícia publicada.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentPosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/noticias/${p.slug}`}
                    className="flex items-start gap-3 px-5 py-3 transition hover:bg-slate-50"
                  >
                    <div className="mt-0.5 flex-1 min-w-0">
                      {p.categoryName && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          {p.categoryName}
                        </span>
                      )}
                      <p className="truncate text-xs font-medium text-slate-800">{p.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {p.authorName && `${p.authorName} · `}
                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(p.createdAt))}
                      </p>
                    </div>
                    <svg className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  )
}
