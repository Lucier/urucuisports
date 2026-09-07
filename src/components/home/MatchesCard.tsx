import { db } from '@/database/client'
import { leagues, matches, teams } from '@/database/schema'
import { cn } from '@/shared/utils'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

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

function MatchItem({ match }: { match: MatchRow }) {
  const isLive = match.status === 'LIVE'
  const isClickable = isLive && !!match.streamUrl
  const Tag = isClickable ? 'a' : 'div'
  const linkProps = isClickable
    ? { href: match.streamUrl!, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Tag
      {...linkProps}
      className={cn(
        'block rounded-lg border px-3 py-2',
        isLive ? 'border-red-200 bg-red-50/40' : 'border-slate-100 bg-white',
        isClickable && 'cursor-pointer transition hover:border-red-400 hover:shadow-sm',
      )}
    >
      {/* Nome da liga */}
      {match.leagueName && (
        <p className="mb-1.5 text-xs font-semibold text-emerald-700">{match.leagueName}</p>
      )}

      <div className="flex items-center gap-2">
        {/* Casa */}
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-slate-800">
          {match.homeTeamName}
        </span>

        {/* Placar / horário */}
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
          {isLive ? (
            <>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {match.homeScore ?? 0}
                <span className="mx-0.5 text-slate-300">×</span>
                {match.awayScore ?? 0}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Assistir Agora
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-slate-600">
                {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                  new Date(match.date),
                )}
              </span>
              <span className="text-xs text-slate-400">
                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
                  new Date(match.date),
                )}
              </span>
            </>
          )}
        </div>

        {/* Visitante */}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
          {match.awayTeamName}
        </span>
      </div>
    </Tag>
  )
}

export async function MatchesCard() {
  const homeAlias = alias(teams, 'home_team')
  const awayAlias = alias(teams, 'away_team')

  const [liveRows, scheduledRows] = await Promise.all([
    // Ao vivo — todas as ligas
    db
      .select({
        id: matches.id,
        homeTeamName: homeAlias.name,
        awayTeamName: awayAlias.name,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        status: matches.status,
        date: matches.date,
        leagueName: leagues.name,
        streamUrl: matches.streamUrl,
      })
      .from(matches)
      .leftJoin(homeAlias, eq(matches.homeTeamId, homeAlias.id))
      .leftJoin(awayAlias, eq(matches.awayTeamId, awayAlias.id))
      .leftJoin(leagues, eq(matches.leagueId, leagues.id))
      .where(eq(matches.status, 'LIVE'))
      .orderBy(matches.date),

    // Próximos — todas as ligas, os 6 mais próximos
    db
      .select({
        id: matches.id,
        homeTeamName: homeAlias.name,
        awayTeamName: awayAlias.name,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        status: matches.status,
        date: matches.date,
        leagueName: leagues.name,
        streamUrl: matches.streamUrl,
      })
      .from(matches)
      .leftJoin(homeAlias, eq(matches.homeTeamId, homeAlias.id))
      .leftJoin(awayAlias, eq(matches.awayTeamId, awayAlias.id))
      .leftJoin(leagues, eq(matches.leagueId, leagues.id))
      .where(eq(matches.status, 'SCHEDULED'))
      .orderBy(matches.date)
      .limit(6),
  ])

  if (liveRows.length === 0 && scheduledRows.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3">
          <p className="text-sm font-bold text-white">Jogos</p>
        </div>
        <p className="p-4 text-sm text-slate-400">Nenhum jogo agendado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3">
        <p className="text-sm font-bold text-white">Jogos</p>
      </div>

      <div className="space-y-4 p-3">
        {liveRows.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-bold tracking-widest text-red-600 uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="space-y-2">
              {liveRows.map((m) => (
                <MatchItem key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {scheduledRows.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Próximos Jogos
            </p>
            <div className="space-y-2">
              {scheduledRows.map((m) => (
                <MatchItem key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
