import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { desc, eq, and, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/database/client'
import { leagues, teams, standings, topScorers, matches, rounds, matchGoals, players } from '@/database/schema'
import { LeagueTabs, type TabKey } from '@/components/stats/LeagueTabs'
import { StandingsTable } from '@/components/stats/StandingsTable'
import { TopScorers } from '@/components/stats/TopScorers'
import { MatchCalendar } from '@/components/stats/MatchCalendar'
import { KnockoutBracket } from '@/components/stats/KnockoutBracket'

interface PageProps {
  params: Promise<{ leagueSlug: string }>
  searchParams: Promise<{ aba?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { leagueSlug } = await params
  const [league] = await db
    .select({ name: leagues.name, country: leagues.country })
    .from(leagues)
    .where(eq(leagues.slug, leagueSlug))
    .limit(1)

  if (!league) return {}
  return {
    title: `${league.name} | Estatísticas | Urucuí Sports`,
    description: `Classificação, artilharia e calendário do ${league.name}.`,
  }
}

export const dynamic = 'force-dynamic'

const VALID_TABS: TabKey[] = ['classificacao', 'artilharia', 'calendario', 'fase-final']

export default async function LeaguePage({ params, searchParams }: PageProps) {
  const { leagueSlug } = await params
  const { aba } = await searchParams
  const activeTab: TabKey = VALID_TABS.includes(aba as TabKey) ? (aba as TabKey) : 'classificacao'

  // 1. Fetch league
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, leagueSlug))
    .limit(1)

  if (!league) notFound()

  // 2. Fetch all tab data in parallel
  const homeTeamAlias = alias(teams, 'home_team')
  const awayTeamAlias = alias(teams, 'away_team')

  const homeTeamAlias2 = alias(teams, 'home_team_ko')
  const awayTeamAlias2 = alias(teams, 'away_team_ko')

  const [standingRows, scorerRows, matchRows, goalRows, knockoutRows] = await Promise.all([
    db
      .select({
        id: teams.id,
        teamName: teams.name,
        grupo: teams.grupo,
        played:       sql<number>`COALESCE(${standings.played}, 0)`,
        won:          sql<number>`COALESCE(${standings.won}, 0)`,
        drawn:        sql<number>`COALESCE(${standings.drawn}, 0)`,
        lost:         sql<number>`COALESCE(${standings.lost}, 0)`,
        goalsFor:     sql<number>`COALESCE(${standings.goalsFor}, 0)`,
        goalsAgainst: sql<number>`COALESCE(${standings.goalsAgainst}, 0)`,
        points:       sql<number>`COALESCE(${standings.points}, 0)`,
      })
      .from(teams)
      .leftJoin(standings, and(eq(standings.teamId, teams.id), eq(standings.leagueId, league.id)))
      .where(eq(teams.leagueId, league.id))
      .orderBy(
        desc(sql`COALESCE(${standings.points}, 0)`),
        desc(sql`COALESCE(${standings.goalsFor}, 0) - COALESCE(${standings.goalsAgainst}, 0)`),
        desc(sql`COALESCE(${standings.goalsFor}, 0)`),
      ),

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
      .where(eq(topScorers.leagueId, league.id))
      .orderBy(desc(topScorers.goals), desc(topScorers.assists)),

    db
      .select({
        id: matches.id,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        homeTeamName: homeTeamAlias.name,
        homeTeamLogo: homeTeamAlias.logoUrl,
        awayTeamName: awayTeamAlias.name,
        awayTeamLogo: awayTeamAlias.logoUrl,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        status: matches.status,
        date: matches.date,
        grupo: rounds.grupo,
        roundNome: rounds.nome,
        roundNumero: rounds.numero,
      })
      .from(matches)
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .leftJoin(rounds, eq(matches.roundId, rounds.id))
      .where(eq(matches.leagueId, league.id))
      .orderBy(matches.date),

    db
      .select({
        matchId: matchGoals.matchId,
        teamId: matchGoals.teamId,
        playerName: players.name,
        goals: matchGoals.goals,
      })
      .from(matchGoals)
      .innerJoin(players, eq(matchGoals.playerId, players.id))
      .innerJoin(matches, eq(matchGoals.matchId, matches.id))
      .where(eq(matches.leagueId, league.id)),

    db
      .select({
        id: matches.id,
        homeTeamName: homeTeamAlias2.name,
        homeTeamLogo: homeTeamAlias2.logoUrl,
        awayTeamName: awayTeamAlias2.name,
        awayTeamLogo: awayTeamAlias2.logoUrl,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        status: matches.status,
        date: matches.date,
        roundNome: rounds.nome,
        roundNumero: rounds.numero,
      })
      .from(matches)
      .innerJoin(rounds, and(eq(matches.roundId, rounds.id), isNull(rounds.grupo)))
      .innerJoin(homeTeamAlias2, eq(matches.homeTeamId, homeTeamAlias2.id))
      .innerJoin(awayTeamAlias2, eq(matches.awayTeamId, awayTeamAlias2.id))
      .where(eq(matches.leagueId, league.id))
      .orderBy(rounds.numero, matches.date),
  ])

  // Build goal scorer map: matchId → { teamId → 'PlayerName (×N)' list }
  const goalMap = new Map<string, Map<string, string[]>>()
  for (const g of goalRows) {
    if (!goalMap.has(g.matchId)) goalMap.set(g.matchId, new Map())
    const teamMap = goalMap.get(g.matchId)!
    if (!teamMap.has(g.teamId)) teamMap.set(g.teamId, [])
    const label = g.goals > 1 ? `${g.playerName} (×${g.goals})` : g.playerName
    teamMap.get(g.teamId)!.push(label)
  }

  const calendarMatches = matchRows.map((m) => {
    const scorers = goalMap.get(m.id)
    return {
      ...m,
      homeScorers: m.homeTeamId && scorers?.get(m.homeTeamId) ? scorers.get(m.homeTeamId)! : [],
      awayScorers: m.awayTeamId && scorers?.get(m.awayTeamId) ? scorers.get(m.awayTeamId)! : [],
    }
  })

  const FLAG: Record<string, string> = { Brasil: '🇧🇷', 'América do Sul': '🌎' }
  const flag = FLAG[league.country ?? ''] ?? '🏆'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-emerald-600">Início</Link>
        <span>/</span>
        <Link href="/estatisticas" className="hover:text-emerald-600">Estatísticas</Link>
        <span>/</span>
        <span className="text-slate-600">{league.name}</span>
      </nav>

      {/* Hero da liga */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-900">
        <div className="flex items-center gap-4 px-4 py-5 sm:gap-5 sm:px-8 sm:py-7">
          {league.logoUrl ? (
            <Image
              src={league.logoUrl}
              alt={`Logo ${league.name}`}
              width={72}
              height={72}
              className="h-16 w-16 flex-shrink-0 object-contain drop-shadow sm:h-20 sm:w-20"
            />
          ) : (
            <span className="text-4xl drop-shadow sm:text-5xl" aria-hidden>{flag}</span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-white sm:text-2xl lg:text-3xl">{league.name}</h1>
            {league.country && (
              <p className="mt-0.5 text-sm text-emerald-300">{league.country}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right">
            <span className="text-xs text-emerald-300 sm:text-sm">{standingRows.length} times</span>
            <span className="text-xs text-emerald-300 sm:text-sm">{matchRows.length} partidas</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-t-xl border border-b-0 border-slate-100 bg-white overflow-hidden">
        <LeagueTabs activeTab={activeTab} showKnockout={league.tipo === 'grupos'} />
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="rounded-b-xl border border-t-0 border-slate-100 p-0">
        {activeTab === 'classificacao' && (
          <StandingsTable standings={standingRows} leagueType={league.tipo} />
        )}
        {activeTab === 'artilharia' && <TopScorers scorers={scorerRows} />}
        {activeTab === 'calendario' && <MatchCalendar matches={calendarMatches} leagueType={league.tipo} />}
        {activeTab === 'fase-final' && (
          <KnockoutBracket matches={knockoutRows} />
        )}
      </div>
    </div>
  )
}
