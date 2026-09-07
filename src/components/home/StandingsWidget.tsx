import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { standings, teams, leagues } from '@/database/schema'
import { cn } from '@/shared/utils'

export async function StandingsWidget() {
  const rows = await db
    .select({
      id: standings.id,
      points: standings.points,
      played: standings.played,
      won: standings.won,
      drawn: standings.drawn,
      lost: standings.lost,
      goalsFor: standings.goalsFor,
      goalsAgainst: standings.goalsAgainst,
      teamName: teams.name,
    })
    .from(standings)
    .leftJoin(teams, eq(standings.teamId, teams.id))
    .leftJoin(leagues, eq(standings.leagueId, leagues.id))
    .where(eq(leagues.slug, 'brasileirao-serie-a'))
    .orderBy(desc(standings.points))
    .limit(5)

  if (rows.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Classificação</h2>
        <Link
          href="/classificacao/brasileirao-serie-a"
          className="text-sm font-medium text-emerald-600 hover:underline"
        >
          Completa →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3">
          <p className="text-sm font-bold text-white">Brasileirão Série A</p>
        </div>

        {/* Cabeçalho */}
        <div className="grid grid-cols-[1.5rem_1fr_2.5rem_1.75rem_2rem_2rem] gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span>#</span>
          <span>Time</span>
          <span className="text-right text-slate-600">Pts</span>
          <span className="text-center">J</span>
          <span className="text-center">SG</span>
          <span className="text-center">GF</span>
        </div>

        <div className="divide-y divide-slate-50">
          {rows.map((row, i) => {
            const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0)
            const isLibertadores = i < 4

            return (
              <div
                key={row.id}
                className={cn(
                  'grid grid-cols-[1.5rem_1fr_2.5rem_1.75rem_2rem_2rem] items-center gap-2 px-4 py-3',
                  isLibertadores && 'border-l-4 border-l-emerald-500',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-bold',
                    isLibertadores ? 'text-emerald-700' : 'text-gray-400',
                  )}
                >
                  {i + 1}
                </span>
                <span className="truncate text-sm font-semibold text-slate-800">
                  {row.teamName}
                </span>
                <span className="text-right text-sm font-bold text-slate-900">{row.points}</span>
                <span className="text-center text-sm text-gray-500">{row.played}</span>
                <span className="text-center text-sm text-gray-500">
                  {gd > 0 ? `+${gd}` : gd}
                </span>
                <span className="text-center text-sm text-gray-500">{row.goalsFor}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span className="text-xs text-gray-400">Zona Libertadores</span>
        </div>
      </div>
    </section>
  )
}
