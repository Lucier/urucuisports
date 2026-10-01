'use client'

import { useRouter } from 'next/navigation'

type League = { id: string; name: string }

export function LeagueFilter({
  leagues,
  selected,
}: {
  leagues: League[]
  selected: string
}) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const leagueId = e.target.value
    const params = new URLSearchParams()
    if (leagueId) params.set('leagueId', leagueId)
    params.set('page', '1')
    router.push(`/admin/times?${params}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="league-filter" className="text-sm font-medium text-slate-600 whitespace-nowrap">
        Filtrar por liga
      </label>
      <select
        id="league-filter"
        value={selected}
        onChange={handleChange}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="">Todas as ligas</option>
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  )
}
