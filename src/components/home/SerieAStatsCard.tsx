import Link from 'next/link'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/database/client'
import { standings, teams, leagues } from '@/database/schema'
import { cn } from '@/shared/utils'

export async function SerieAStatsCard() {
  // Busca a primeira liga disponível (prioriza "urucuiense-serie-a" se existir)
  const allLeagues = await db
    .select({ id: leagues.id, name: leagues.name, slug: leagues.slug })
    .from(leagues)
    .orderBy(asc(leagues.name))
    .limit(5)

  if (allLeagues.length === 0) return null

  const league =
    allLeagues.find((l) => l.slug === 'urucuiense-serie-a') ?? allLeagues[0]

  // Busca classificação com o grupo de cada time (leftJoin para incluir times sem partidas)
  const rows = await db
    .select({
      teamId: teams.id,
      points:       sql<number>`COALESCE(${standings.points}, 0)`,
      played:       sql<number>`COALESCE(${standings.played}, 0)`,
      won:          sql<number>`COALESCE(${standings.won}, 0)`,
      drawn:        sql<number>`COALESCE(${standings.drawn}, 0)`,
      lost:         sql<number>`COALESCE(${standings.lost}, 0)`,
      goalsFor:     sql<number>`COALESCE(${standings.goalsFor}, 0)`,
      goalsAgainst: sql<number>`COALESCE(${standings.goalsAgainst}, 0)`,
      teamName: teams.name,
      grupo: teams.grupo,
    })
    .from(teams)
    .leftJoin(standings, eq(standings.teamId, teams.id))
    .where(eq(teams.leagueId, league.id))
    .orderBy(
      desc(sql`COALESCE(${standings.points}, 0)`),
      desc(sql`COALESCE(${standings.goalsFor}, 0) - COALESCE(${standings.goalsAgainst}, 0)`),
    )

  if (rows.length === 0) return null

  // Agrupa por grupo e ordena internamente por pontos
  const byGroup = new Map<number, typeof rows>()
  for (const row of rows) {
    const g = row.grupo ?? 0
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(row)
  }

  const groups = [...byGroup.entries()]
    .sort(([a], [b]) => a - b)
    .map(([num, members]) => ({
      num,
      label: num === 1 ? 'Grupo A' : num === 2 ? 'Grupo B' : `Grupo ${num}`,
      rows: members,
    }))

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Cabeçalho da liga */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3">
        <p className="text-sm font-bold text-white">{league.name}</p>
        <span className="text-lg" aria-hidden>🇧🇷</span>
      </div>

      {groups.map((group, gi) => (
        <div key={group.num}>
          {/* Separador entre grupos */}
          {gi > 0 && <div className="h-px bg-slate-100" />}

          {/* Label do grupo */}
          <div className="bg-slate-50 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {group.label}
            </span>
          </div>

          {/* Cabeçalho colunas */}
          <div className="grid grid-cols-[1.25rem_1fr_2rem_2rem_1.75rem] gap-x-2 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>#</span>
            <span>Time</span>
            <span className="text-center font-bold text-slate-600">Pts</span>
            <span className="text-center">J</span>
            <span className="text-center">SG</span>
          </div>

          <div className="divide-y divide-slate-50">
            {group.rows.map((row, i) => {
              const gd = row.goalsFor - row.goalsAgainst
              const isClassificado = i < 2
              const isRebaixamento = i === group.rows.length - 1
              return (
                <div
                  key={row.teamId}
                  className={cn(
                    'grid grid-cols-[1.25rem_1fr_2rem_2rem_1.75rem] items-center gap-x-2 px-4 py-2.5',
                    isClassificado && 'border-l-4 border-l-emerald-500',
                    isRebaixamento && 'border-l-4 border-l-red-400',
                  )}
                >
                  <span className={cn(
                    'text-xs font-bold',
                    isClassificado ? 'text-emerald-700' : isRebaixamento ? 'text-red-500' : 'text-slate-400',
                  )}>
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-800">{row.teamName}</span>
                  <span className="text-center text-sm font-bold text-slate-900">{row.points}</span>
                  <span className="text-center text-xs text-slate-500">{row.played}</span>
                  <span className="text-center text-xs text-slate-500">
                    {gd > 0 ? `+${gd}` : gd}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" />
          <span className="text-xs text-slate-400">Classificação</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-red-400" />
          <span className="text-xs text-slate-400">Rebaixamento</span>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3">
        <Link
          href={`/estatisticas/${league.slug}`}
          className="flex items-center justify-between text-sm font-medium text-emerald-700 hover:text-emerald-600 hover:underline"
        >
          <span>Classificação completa</span>
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/estatisticas"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          <span>Ver todas as ligas</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
