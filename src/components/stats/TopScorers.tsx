'use client'

import Image from 'next/image'

export interface ScorerRow {
  id: string
  playerName: string
  teamName: string | null
  fotoUrl: string | null
  goals: number
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function TopScorers({ scorers }: { scorers: ScorerRow[] }) {
  if (scorers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl" aria-hidden>
          ⚽
        </span>
        <p className="text-slate-500">Nenhum artilheiro registrado nesta competição.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="grid grid-cols-[2rem_1fr_3.5rem] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid-cols-[2.5rem_1fr_5rem] sm:gap-3 sm:px-4">
        <span>#</span>
        <span>Jogador</span>
        <span className="text-center">Gols</span>
      </div>

      <div className="divide-y divide-slate-50">
        {scorers.map((scorer, i) => {
          const pos = i + 1
          const medal = MEDAL[pos]

          return (
            <div
              key={scorer.id}
              className="grid grid-cols-[2rem_1fr_3.5rem] items-center gap-2 px-3 py-3 transition-colors hover:bg-slate-50 sm:grid-cols-[2.5rem_1fr_5rem] sm:gap-3 sm:px-4 sm:py-3.5"
            >
              <div className="flex items-center justify-center">
                {medal ? (
                  <span className="text-xl" aria-label={`${pos}º lugar`}>
                    {medal}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">{pos}</span>
                )}
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full sm:h-9 sm:w-9">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-slate-900 text-xs font-bold text-white">
                    {scorer.playerName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  {scorer.fotoUrl && (
                    <Image
                      src={scorer.fotoUrl}
                      alt={scorer.playerName}
                      fill
                      sizes="36px"
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{scorer.playerName}</p>
                  {scorer.teamName && (
                    <p className="truncate text-xs text-gray-400">{scorer.teamName}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-slate-900">{scorer.goals}</span>
                <span className="text-xs text-gray-400">gols</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
