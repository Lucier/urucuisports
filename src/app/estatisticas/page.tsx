import type { Metadata } from 'next'
import Link from 'next/link'
import { count, eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { leagues, teams, matches } from '@/database/schema'

export const metadata: Metadata = {
  title: 'Estatísticas | Urucuí Sports',
  description: 'Tabelas, artilharia e calendário das competições.',
}

const FLAG: Record<string, string> = {
  Brasil: '🇧🇷',
  'América do Sul': '🌎',
}

export default async function EstatisticasPage() {
  const rows = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      slug: leagues.slug,
      country: leagues.country,
      teamCount: count(teams.id),
    })
    .from(leagues)
    .leftJoin(teams, eq(teams.leagueId, leagues.id))
    .groupBy(leagues.id)
    .orderBy(leagues.name)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Estatísticas</h1>
        <p className="mt-1 text-gray-500">
          Classificações, artilharia e calendário de cada competição
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((league) => {
          const flag = FLAG[league.country ?? ''] ?? '🏆'

          return (
            <Link
              key={league.id}
              href={`/estatisticas/${league.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Banner */}
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900">
                <span className="text-6xl drop-shadow-lg" aria-hidden>
                  {flag}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                  {league.name}
                </h2>
                {league.country && (
                  <p className="mt-0.5 text-sm text-gray-400">{league.country}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-gray-400">
                    {league.teamCount} {league.teamCount === 1 ? 'time' : 'times'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
                    Ver detalhes
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
