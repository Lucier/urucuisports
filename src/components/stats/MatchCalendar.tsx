import { cn } from '@/shared/utils'

export interface CalendarMatch {
  id: string
  homeTeamName: string | null
  awayTeamName: string | null
  homeScore: number | null
  awayScore: number | null
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  date: Date
  grupo?: number | null
  roundNome?: string | null
  roundNumero?: number | null
  homeScorers?: string[]
  awayScorers?: string[]
}

function groupLabel(num: number): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  return `Grupo ${letters[num - 1] ?? num}`
}

function MatchRow({ match, pos }: { match: CalendarMatch; pos: number }) {
  const isLive = match.status === 'LIVE'
  const isFinished = match.status === 'FINISHED'
  const showScore = isLive || isFinished
  const d = new Date(match.date)

  const dateStr = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d)
  const timeStr = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d)

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-3 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-4 sm:py-4',
        isLive && 'bg-red-50/50',
      )}
    >
      <span className="hidden w-5 flex-shrink-0 pt-1.5 text-right text-xs font-medium text-gray-300 sm:block">
        {pos}
      </span>

      <div className="w-12 flex-shrink-0 pt-0.5 text-center sm:w-14">
        <p className="text-xs font-semibold text-slate-600">{dateStr}</p>
        <p className="text-xs text-gray-400">{timeStr}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="min-w-0 truncate text-right text-xs font-semibold text-slate-800 sm:text-sm">
            {match.homeTeamName}
          </span>
          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-500 to-slate-900 sm:h-8 sm:w-8" />
        </div>
        {showScore && match.homeScorers && match.homeScorers.length > 0 && (
          <ul className="space-y-0 text-right">
            {match.homeScorers.map((name, i) => (
              <li key={i} className="text-[10px] leading-tight text-slate-500">⚽ {name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex w-16 flex-shrink-0 flex-col items-center gap-0.5 pt-0.5 sm:w-20">
        {showScore ? (
          <span className="text-sm font-bold tabular-nums text-slate-900 sm:text-base">
            {match.homeScore} <span className="text-slate-300">–</span> {match.awayScore}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400 sm:text-sm">vs</span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Ao vivo
          </span>
        )}
        {isFinished && (
          <span className="text-[10px] text-gray-400">Encerrado</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-600 to-slate-900 sm:h-8 sm:w-8" />
          <span className="min-w-0 truncate text-xs font-semibold text-slate-800 sm:text-sm">
            {match.awayTeamName}
          </span>
        </div>
        {showScore && match.awayScorers && match.awayScorers.length > 0 && (
          <ul className="space-y-0">
            {match.awayScorers.map((name, i) => (
              <li key={i} className="text-[10px] leading-tight text-slate-500">⚽ {name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusSections({ matches }: { matches: CalendarMatch[] }) {
  const live = matches.filter((m) => m.status === 'LIVE')
  const finished = matches.filter((m) => m.status === 'FINISHED').reverse()
  const scheduled = matches.filter((m) => m.status === 'SCHEDULED')

  const sections: { label: string; items: CalendarMatch[]; accent?: string }[] = [
    ...(live.length > 0 ? [{ label: 'Ao Vivo', items: live, accent: 'text-red-600' }] : []),
    ...(finished.length > 0 ? [{ label: 'Resultados', items: finished }] : []),
    ...(scheduled.length > 0 ? [{ label: 'Próximas Partidas', items: scheduled }] : []),
  ]

  return (
    <>
      {sections.map((section) => (
        <div key={section.label}>
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
            <h3 className={cn('text-xs font-bold uppercase tracking-widest', section.accent ?? 'text-gray-400')}>
              {section.label}
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {section.items.map((match, i) => (
              <MatchRow key={match.id} match={match} pos={i + 1} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function MatchCalendar({
  matches,
  leagueType,
}: {
  matches: CalendarMatch[]
  leagueType?: string | null
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl" aria-hidden>📅</span>
        <p className="text-slate-500">Nenhuma partida registrada nesta competição.</p>
      </div>
    )
  }

  if (leagueType === 'grupos') {
    const groupMatches = matches.filter((m) => m.grupo != null)

    const byGroup = new Map<number, CalendarMatch[]>()
    for (const m of groupMatches) {
      const g = m.grupo!
      if (!byGroup.has(g)) byGroup.set(g, [])
      byGroup.get(g)!.push(m)
    }
    const groups = [...byGroup.entries()].sort(([a], [b]) => a - b)

    return (
      <div className="space-y-6 p-4">
        {groups.map(([num, gMatches]) => (
          <div key={num} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-600">
                {groupLabel(num)}
              </span>
            </div>
            <StatusSections matches={gMatches} />
          </div>
        ))}
      </div>
    )
  }

  // Pontos corridos — tabela única
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <StatusSections matches={matches} />
    </div>
  )
}
