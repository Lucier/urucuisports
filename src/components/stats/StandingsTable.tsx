import { cn } from '@/shared/utils'

export interface StandingRow {
  id: string
  teamName: string | null
  grupo?: number | null
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

function groupLabel(num: number): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  return `Grupo ${letters[num - 1] ?? num}`
}

function TableRows({ rows }: { rows: StandingRow[] }) {
  return (
    <tbody className="divide-y divide-slate-50">
      {rows.map((row, i) => {
        const pos = i + 1
        const total = rows.length
        const isClassificado = i < 2
        const isRebaixamento = i === total - 1
        const gd = row.goalsFor - row.goalsAgainst

        return (
          <tr
            key={row.id}
            className={cn(
              'border-l-4 transition-colors hover:bg-slate-50',
              isClassificado && 'border-l-emerald-500',
              isRebaixamento && 'border-l-red-400',
              !isClassificado && !isRebaixamento && 'border-l-transparent',
            )}
          >
            <td className="px-2 py-3 sm:px-4 sm:py-3.5">
              <span className={cn(
                'text-sm font-bold',
                isClassificado ? 'text-emerald-700' : isRebaixamento ? 'text-red-500' : 'text-gray-400',
              )}>
                {pos}
              </span>
            </td>
            <td className="px-2 py-3 sm:px-4 sm:py-3.5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-500 to-slate-800 sm:h-8 sm:w-8" />
                <span className="font-semibold text-slate-800">{row.teamName}</span>
              </div>
            </td>
            <td className="px-2 py-3 text-center text-base font-bold text-slate-900 sm:px-4 sm:py-3.5">{row.points}</td>
            <td className="px-2 py-3 text-center text-slate-600 sm:px-4 sm:py-3.5">{row.played}</td>
            <td className="hidden px-2 py-3 text-center font-medium text-emerald-700 sm:table-cell sm:px-4 sm:py-3.5">{row.won}</td>
            <td className="hidden px-2 py-3 text-center text-slate-600 sm:table-cell sm:px-4 sm:py-3.5">{row.drawn}</td>
            <td className="hidden px-2 py-3 text-center text-slate-600 sm:table-cell sm:px-4 sm:py-3.5">{row.lost}</td>
            <td className="hidden px-2 py-3 text-center text-slate-600 md:table-cell sm:px-4 sm:py-3.5">{row.goalsFor}</td>
            <td className="hidden px-2 py-3 text-center text-slate-600 md:table-cell sm:px-4 sm:py-3.5">{row.goalsAgainst}</td>
            <td className="px-2 py-3 text-center font-medium text-slate-700 sm:px-4 sm:py-3.5">
              {gd > 0 ? `+${gd}` : gd}
            </td>
          </tr>
        )
      })}
    </tbody>
  )
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <th className="w-8 px-2 py-3 text-left sm:w-10 sm:px-4">#</th>
        <th className="px-2 py-3 text-left sm:px-4">Time</th>
        <th className="px-2 py-3 text-center font-bold text-slate-700 sm:px-4" title="Pontos">Pts</th>
        <th className="px-2 py-3 text-center sm:px-4" title="Jogos">J</th>
        <th className="hidden px-2 py-3 text-center sm:table-cell sm:px-4" title="Vitórias">V</th>
        <th className="hidden px-2 py-3 text-center sm:table-cell sm:px-4" title="Empates">E</th>
        <th className="hidden px-2 py-3 text-center sm:table-cell sm:px-4" title="Derrotas">D</th>
        <th className="hidden px-2 py-3 text-center md:table-cell sm:px-4" title="Gols Pró">GP</th>
        <th className="hidden px-2 py-3 text-center md:table-cell sm:px-4" title="Gols Contra">GC</th>
        <th className="px-2 py-3 text-center sm:px-4" title="Saldo de Gols">SG</th>
      </tr>
    </thead>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 px-4 py-3 text-xs text-gray-400">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-emerald-500" />
        Classificação
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-red-400" />
        Rebaixamento
      </span>
    </div>
  )
}

export function StandingsTable({
  standings,
  leagueType,
}: {
  standings: StandingRow[]
  leagueType?: string | null
}) {
  const isGroups = leagueType === 'grupos'

  if (isGroups) {
    // Agrupa por grupo e ordena dentro de cada grupo por pontos
    const byGroup = new Map<number, StandingRow[]>()
    for (const row of standings) {
      const g = row.grupo ?? 0
      if (!byGroup.has(g)) byGroup.set(g, [])
      byGroup.get(g)!.push(row)
    }

    const groups = [...byGroup.entries()]
      .sort(([a], [b]) => a - b)
      .map(([num, rows]) => ({
        num,
        label: groupLabel(num),
        rows: [...rows].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          const gdA = a.goalsFor - a.goalsAgainst
          const gdB = b.goalsFor - b.goalsAgainst
          if (gdB !== gdA) return gdB - gdA
          return b.goalsFor - a.goalsFor
        }),
      }))

    return (
      <div className="space-y-6 p-4">
        {groups.map((group) => (
          <div key={group.num} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {/* Cabeçalho do grupo */}
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-600">
                {group.label}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-full text-sm sm:min-w-[500px]">
                <TableHead />
                <TableRows rows={group.rows} />
              </table>
            </div>

            <Legend />
          </div>
        ))}
      </div>
    )
  }

  // Liga de pontos corridos — tabela única
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-sm sm:min-w-[500px]">
          <TableHead />
          <TableRows rows={standings} />
        </table>
      </div>
      <Legend />
    </div>
  )
}
