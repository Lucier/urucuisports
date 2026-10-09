export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { artilharia, teams, leagues } from '@/database/schema'
import { TopScorers } from '@/components/stats/TopScorers'

export const metadata: Metadata = {
  title: 'Artilharia | Urucuí Sports',
  description: 'Ranking de artilheiros de todas as competições.',
}

interface PageProps {
  searchParams: Promise<{ liga?: string }>
}

export default async function ArtilhariaPage({ searchParams }: PageProps) {
  const { liga } = await searchParams

  const allLeagues = await db
    .select({ id: leagues.id, name: leagues.name, slug: leagues.slug })
    .from(leagues)
    .orderBy(leagues.name)

  const activeLeague = liga
    ? allLeagues.find((l) => l.slug === liga) ?? allLeagues[0]
    : allLeagues[0]

  const scorers = activeLeague
    ? await db
        .select({
          id: artilharia.id,
          playerName: artilharia.nomeJogador,
          teamName: teams.name,
          fotoUrl: artilharia.fotoUrl,
          goals: artilharia.gols,
        })
        .from(artilharia)
        .innerJoin(teams, eq(artilharia.teamId, teams.id))
        .where(eq(artilharia.leagueId, activeLeague.id))
        .orderBy(desc(artilharia.gols))
    : []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-emerald-600">Início</Link>
        <span>/</span>
        <span className="text-slate-600">Artilharia</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold text-slate-900">Artilharia</h1>

      {allLeagues.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allLeagues.map((league) => {
            const isActive = league.id === activeLeague?.id
            return (
              <Link
                key={league.id}
                href={`/artilharia?liga=${league.slug}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {league.name}
              </Link>
            )
          })}
        </div>
      )}

      <TopScorers scorers={scorers} />
    </div>
  )
}
