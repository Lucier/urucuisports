export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, count } from 'drizzle-orm'
import { db } from '@/database/client'
import { teams, players } from '@/database/schema'
import { PlayerManager } from '@/components/admin/PlayerManager'
import { Pagination } from '@/components/admin/Pagination'
import { SafeImage } from '@/components/ui/SafeImage'

export const metadata = { title: 'Jogadores — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ time?: string; page?: string }> }

export default async function AdminJogadoresPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { time: teamId, page: pageParam } = await searchParams

  // ── Vista de jogadores de um time específico ──────────────────────────────
  if (teamId) {
    const [team] = await db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl })
      .from(teams)
      .where(eq(teams.id, teamId))

    if (!team) redirect('/admin/jogadores')

    const page = Math.max(1, Number(pageParam) || 1)
    const offset = (page - 1) * PAGE_SIZE

    const [[{ value: total }], playerRows] = await Promise.all([
      db.select({ value: count() }).from(players).where(eq(players.teamId, teamId)),
      db
        .select({
          id: players.id,
          name: players.name,
          position: players.position,
          photoUrl: players.photoUrl,
          teamId: players.teamId,
        })
        .from(players)
        .where(eq(players.teamId, teamId))
        .orderBy(players.name)
        .limit(PAGE_SIZE)
        .offset(offset),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
      <div className="py-8">
        {/* Cabeçalho com breadcrumb */}
        <div className="mb-8">
          <Link
            href="/admin/jogadores"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Todos os times
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                {team.name.charAt(0)}
              </div>
              {team.logoUrl && (
                <SafeImage
                  src={team.logoUrl}
                  alt={team.name}
                  className="absolute inset-0 h-full w-full rounded-full border border-slate-100 object-contain bg-slate-50"
                />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{team.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">Gerencie o elenco do time</p>
            </div>
          </div>
        </div>

        <PlayerManager players={playerRows} teamId={teamId} totalCount={total} />
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/jogadores"
          extraParams={{ time: teamId }}
        />
      </div>
    )
  }

  // ── Vista de seleção de time ───────────────────────────────────────────────
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], teamRows] = await Promise.all([
    db.select({ value: count() }).from(teams),
    db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl })
      .from(teams)
      .orderBy(teams.name)
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Jogadores</h1>
        <p className="mt-1 text-sm text-slate-500">Escolha um time para gerenciar seu elenco</p>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhum time cadastrado ainda.</p>
          <Link
            href="/admin/times"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Cadastrar times
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamRows.map((team) => (
              <Link
                key={team.id}
                href={`/admin/jogadores?time=${team.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="relative h-12 w-12 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                    {team.name.charAt(0)}
                  </div>
                  {team.logoUrl && (
                    <SafeImage
                      src={team.logoUrl}
                      alt={team.name}
                      className="absolute inset-0 h-full w-full rounded-full border border-slate-100 object-contain bg-slate-50"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{team.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Ver elenco →</p>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath="/admin/jogadores" />
        </>
      )}
    </div>
  )
}
