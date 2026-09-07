import { db } from '@/database/client'
import { leagues, matches, teams } from '@/database/schema'
import { cn } from '@/shared/utils'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import Link from 'next/link'

type MatchRow = {
  id: string
  homeTeamName: string | null
  awayTeamName: string | null
  homeScore: number | null
  awayScore: number | null
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  date: Date
  leagueName: string | null
  streamUrl: string | null
}

function StatusBadge({ status, date }: { status: MatchRow['status']; date: Date }) {
  if (status === 'LIVE') {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        AO VIVO
      </span>
    )
  }
  if (status === 'FINISHED') {
    return <span className="text-xs text-gray-400">Encerrado</span>
  }
  if (status === 'POSTPONED') {
    return <span className="text-xs font-medium text-amber-500">Adiado</span>
  }
  return (
    <span className="text-xs text-gray-400">
      {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
        new Date(date),
      )}
    </span>
  )
}

function MatchCard({ match }: { match: MatchRow }) {
  const isLive = match.status === 'LIVE'
  const showScore = match.status === 'FINISHED' || isLive
  const isClickable = isLive && !!match.streamUrl
  const Tag = isClickable ? 'a' : 'div'
  const linkProps = isClickable
    ? { href: match.streamUrl!, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Tag
      {...linkProps}
      className={cn(
        'flex items-center justify-between rounded-xl border bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4',
        isLive && 'border-red-200 bg-red-50/40',
        isClickable && 'cursor-pointer transition hover:border-red-400 hover:shadow-md',
      )}
    >
      {/* Time da casa */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="truncate text-right text-xs font-semibold text-slate-800 sm:text-sm">
          {match.homeTeamName}
        </span>
        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 sm:h-9 sm:w-9" />
      </div>

      {/* Placar / Horário */}
      <div className="mx-2 flex flex-shrink-0 flex-col items-center gap-1">
        {showScore ? (
          <span className="text-base font-bold text-slate-900 tabular-nums sm:text-xl">
            {match.homeScore ?? 0}
            <span className="mx-1 text-slate-300">×</span>
            {match.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-600 sm:text-sm">
            {new Intl.DateTimeFormat('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(match.date))}
          </span>
        )}
        <StatusBadge status={match.status} date={match.date} />
      </div>

      {/* Time visitante */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-600 to-slate-900 sm:h-9 sm:w-9" />
        <span className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
          {match.awayTeamName}
        </span>
      </div>
    </Tag>
  )
}

export async function MatchesSection() {
  const homeTeamAlias = alias(teams, 'home_team')
  const awayTeamAlias = alias(teams, 'away_team')

  const rows = await db
    .select({
      id: matches.id,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      status: matches.status,
      date: matches.date,
      leagueName: leagues.name,
      homeTeamName: homeTeamAlias.name,
      awayTeamName: awayTeamAlias.name,
      streamUrl: matches.streamUrl,
    })
    .from(matches)
    .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
    .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
    .leftJoin(leagues, eq(matches.leagueId, leagues.id))
    .orderBy(matches.date)

  if (rows.length === 0) return null

  const live = rows.filter((m) => m.status === 'LIVE')
  const finished = rows.filter((m) => m.status === 'FINISHED')
  const scheduled = rows.filter((m) => m.status === 'SCHEDULED')

  return (
    <section>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Jogos</h2>
        <Link href="/jogos" className="text-sm font-medium text-emerald-600 hover:underline">
          Ver todos →
        </Link>
      </div>

      <div className="space-y-8">
        {live.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-bold tracking-widest text-red-600 uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="space-y-3">
              {live.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {finished.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">
              Encerrados
            </h3>
            <div className="space-y-3">
              {finished.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {scheduled.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">
              Próximos Jogos
            </h3>
            <div className="space-y-3">
              {scheduled.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
