import Image from 'next/image'
import { cn } from '@/shared/utils'

export interface KnockoutMatch {
  id: string
  homeTeamName: string | null
  homeTeamLogo?: string | null
  awayTeamName: string | null
  awayTeamLogo?: string | null
  homeScore: number | null
  awayScore: number | null
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  date: Date
  roundNome?: string | null
  roundNumero?: number | null
}

function roundLabel(nome: string | null | undefined, numero: number | null | undefined): string {
  return nome?.trim() || (numero != null ? `Rodada ${numero}` : 'Fase Final')
}

const STATUS = {
  LIVE:      { label: 'Ao vivo',   cls: 'bg-red-100 text-red-700' },
  FINISHED:  { label: 'Encerrado', cls: 'bg-emerald-100 text-emerald-700' },
  SCHEDULED: { label: 'Agendado',  cls: 'bg-slate-100 text-slate-500' },
  POSTPONED: { label: 'Adiado',    cls: 'bg-amber-100 text-amber-700' },
} as const

function TeamBadge({ name, logo }: { name: string | null; logo?: string | null }) {
  return (
    <div className="relative h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-400">
        {(name ?? '?').charAt(0).toUpperCase()}
      </div>
      {logo && (
        <Image
          src={logo}
          alt={name ?? ''}
          fill
          sizes="56px"
          className="rounded-full border border-slate-100 object-contain bg-white p-1"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

function MatchCard({ match }: { match: KnockoutMatch }) {
  const isLive = match.status === 'LIVE'
  const isFinished = match.status === 'FINISHED'
  const showScore = isLive || isFinished
  const d = new Date(match.date)

  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).format(d)
  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  }).format(d)

  const badge = STATUS[match.status] ?? STATUS.SCHEDULED
  const homeWon = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWon = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0)

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border bg-white shadow-sm',
      isLive ? 'border-red-200' : 'border-slate-100',
    )}>
      {/* Barra superior: status + data */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2',
        isLive ? 'bg-red-50' : 'bg-slate-50',
      )}>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Ao vivo
          </span>
        ) : (
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', badge.cls)}>
            {badge.label}
          </span>
        )}
        <span className="text-xs text-slate-400">{dateStr} · {timeStr}</span>
      </div>

      {/* Confronto */}
      <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6">
        {/* Time da casa */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamBadge name={match.homeTeamName} logo={match.homeTeamLogo} />
          <span className={cn(
            'text-center text-sm font-bold leading-tight sm:text-base',
            homeWon ? 'text-slate-900' : isFinished ? 'text-slate-400' : 'text-slate-700',
          )}>
            {match.homeTeamName ?? '—'}
          </span>
          {homeWon && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Classificado
            </span>
          )}
        </div>

        {/* Placar central */}
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          {showScore ? (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl text-2xl font-extrabold tabular-nums sm:h-12 sm:w-12',
                homeWon ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700',
              )}>
                {match.homeScore}
              </span>
              <span className="text-base font-bold text-slate-300">–</span>
              <span className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl text-2xl font-extrabold tabular-nums sm:h-12 sm:w-12',
                awayWon ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700',
              )}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-slate-300">vs</span>
          )}
        </div>

        {/* Time visitante */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamBadge name={match.awayTeamName} logo={match.awayTeamLogo} />
          <span className={cn(
            'text-center text-sm font-bold leading-tight sm:text-base',
            awayWon ? 'text-slate-900' : isFinished ? 'text-slate-400' : 'text-slate-700',
          )}>
            {match.awayTeamName ?? '—'}
          </span>
          {awayWon && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Classificado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function KnockoutBracket({ matches }: { matches: KnockoutMatch[] }) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl" aria-hidden>🏆</span>
        <p className="text-slate-500">Nenhuma fase eliminatória registrada ainda.</p>
      </div>
    )
  }

  // Agrupa por rodada mantendo ordem cronológica de inserção
  const order: string[] = []
  const map = new Map<string, KnockoutMatch[]>()
  for (const m of matches) {
    const key = `${m.roundNumero ?? 0}-${m.roundNome ?? ''}`
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(m)
  }
  const rounds = order.map((key) => ({
    key,
    label: roundLabel(map.get(key)![0].roundNome, map.get(key)![0].roundNumero),
    items: map.get(key)!,
  }))

  return (
    <div className="space-y-8 p-4">
      {rounds.map((round) => (
        <div key={round.key}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-700">
              <span aria-hidden>🏆</span>
              {round.label}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {round.items.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
