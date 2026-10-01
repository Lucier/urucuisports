import { db } from '@/database/client'
import { artilharia, teams, leagues } from '@/database/schema'
import { desc, eq } from 'drizzle-orm'
import Image from 'next/image'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const SERIE_A_SLUG = 'campeonato-urucuiense-serie-a'

export async function ArtilhariaWidget() {
  const rows = await db
    .select({
      id: artilharia.id,
      nomeJogador: artilharia.nomeJogador,
      fotoUrl: artilharia.fotoUrl,
      gols: artilharia.gols,
      teamName: teams.name,
    })
    .from(artilharia)
    .innerJoin(teams, eq(artilharia.teamId, teams.id))
    .innerJoin(leagues, eq(artilharia.leagueId, leagues.id))
    .where(eq(leagues.slug, SERIE_A_SLUG))
    .orderBy(desc(artilharia.gols))
    .limit(5)

  if (rows.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3">
        <p className="text-sm font-bold text-white">Artilharia</p>
      </div>

      <div className="divide-y divide-slate-50">
        {rows.map((scorer, i) => {
          const pos = i + 1
          const medal = MEDAL[pos]

          return (
            <div
              key={scorer.id}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div className="flex w-6 flex-shrink-0 items-center justify-center">
                {medal ? (
                  <span className="text-base" aria-label={`${pos}º lugar`}>{medal}</span>
                ) : (
                  <span className="text-xs font-bold text-gray-400">{pos}</span>
                )}
              </div>

              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-slate-900 text-xs font-bold text-white">
                  {scorer.nomeJogador.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                </div>
                {scorer.fotoUrl && (
                  <Image
                    src={scorer.fotoUrl}
                    alt={scorer.nomeJogador}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">{scorer.nomeJogador}</p>
                <p className="truncate text-xs text-gray-400">{scorer.teamName}</p>
              </div>

              <div className="flex-shrink-0 text-right">
                <span className="text-base font-bold text-slate-900">{scorer.gols}</span>
                <span className="ml-0.5 text-xs text-gray-400">gols</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
