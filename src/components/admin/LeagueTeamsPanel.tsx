'use client'

import Link from 'next/link'
import Image from 'next/image'
import { addTeamToLeagueAction, removeTeamFromLeagueAction } from '@/app/admin/ligas/actions'

type LeagueTipo = 'pontos_corridos' | 'grupos'

type Team = {
  id: string
  name: string
  logoUrl: string | null
  leagueId: string | null
  grupo: number | null
}

// Converte índice numérico (1-based) para letra: 1→A, 2→B, …
function grupoLabel(n: number) {
  return String.fromCharCode(64 + n) // 65 = 'A'
}

function buildGrupoOptions(numeroGrupos: number) {
  return Array.from({ length: numeroGrupos }, (_, i) => i + 1)
}

function Avatar({ name, logoUrl, inLeague }: { name: string; logoUrl: string | null; inLeague: boolean }) {
  return (
    <div className="relative h-8 w-8 flex-shrink-0">
      <div
        className={`flex h-full w-full items-center justify-center rounded-full text-sm font-bold ${
          inLeague ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {name.charAt(0)}
      </div>
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="32px"
          className="rounded-full border border-slate-100 object-contain bg-slate-50"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

// ── Sub-componente: item de time já na liga ───────────────────────────────────

function InLeagueItem({
  team,
  leagueId,
  tipo,
  numeroGrupos,
}: {
  team: Team
  leagueId: string
  tipo: LeagueTipo
  numeroGrupos: number | null
}) {
  const grupoOptions = tipo === 'grupos' && numeroGrupos ? buildGrupoOptions(numeroGrupos) : []

  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <Avatar name={team.name} logoUrl={team.logoUrl} inLeague />
      <span className="flex-1 text-sm font-medium text-slate-800">{team.name}</span>

      {/* Badge do grupo atual */}
      {tipo === 'grupos' && team.grupo !== null && (
        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          Grupo {grupoLabel(team.grupo)}
        </span>
      )}

      {/* Formulário para mover de grupo (só no modo grupos) */}
      {tipo === 'grupos' && grupoOptions.length > 0 && (
        <form action={addTeamToLeagueAction} className="flex items-center gap-1">
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name="leagueId" value={leagueId} />
          <select
            name="grupo"
            defaultValue={team.grupo ?? ''}
            className="rounded border border-slate-200 py-1 pl-2 pr-6 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="" disabled>Mover para…</option>
            {grupoOptions.map((n) => (
              <option key={n} value={n}>
                Grupo {grupoLabel(n)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Mover
          </button>
        </form>
      )}

      {/* Remover */}
      <form action={removeTeamFromLeagueAction}>
        <input type="hidden" name="teamId" value={team.id} />
        <input type="hidden" name="leagueId" value={leagueId} />
        <button
          type="submit"
          className="rounded px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
          onClick={(e) => {
            if (!confirm(`Remover "${team.name}" da liga?`)) e.preventDefault()
          }}
        >
          Remover
        </button>
      </form>
    </li>
  )
}

// ── Sub-componente: item de time disponível para adicionar ────────────────────

function OutLeagueItem({
  team,
  leagueId,
  tipo,
  numeroGrupos,
}: {
  team: Team
  leagueId: string
  tipo: LeagueTipo
  numeroGrupos: number | null
}) {
  const grupoOptions = tipo === 'grupos' && numeroGrupos ? buildGrupoOptions(numeroGrupos) : []

  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <Avatar name={team.name} logoUrl={team.logoUrl} inLeague={false} />
      <span className="flex-1 text-sm text-slate-600">{team.name}</span>
      {team.leagueId && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
          outra liga
        </span>
      )}

      <form action={addTeamToLeagueAction} className="flex items-center gap-2">
        <input type="hidden" name="teamId" value={team.id} />
        <input type="hidden" name="leagueId" value={leagueId} />

        {/* Seletor de grupo — visível somente em ligas de grupos */}
        {tipo === 'grupos' && grupoOptions.length > 0 && (
          <select
            name="grupo"
            required
            defaultValue=""
            className="rounded border border-slate-200 py-1 pl-2 pr-6 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="" disabled>Grupo…</option>
            {grupoOptions.map((n) => (
              <option key={n} value={n}>
                Grupo {grupoLabel(n)}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          + Adicionar
        </button>
      </form>
    </li>
  )
}

// ── Visualização agrupada (apenas para ligas de grupos) ───────────────────────

function GrupoView({
  leagueId,
  inLeague,
  numeroGrupos,
}: {
  leagueId: string
  inLeague: Team[]
  numeroGrupos: number
}) {
  const grupos = buildGrupoOptions(numeroGrupos)
  // teams sem grupo atribuído
  const semGrupo = inLeague.filter((t) => t.grupo === null)

  return (
    <div className="divide-y divide-slate-100">
      {grupos.map((n) => {
        const membros = inLeague.filter((t) => t.grupo === n)
        return (
          <div key={n}>
            <div className="flex items-center gap-2 bg-slate-50 px-6 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                {grupoLabel(n)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Grupo {grupoLabel(n)}
              </span>
              <span className="ml-auto text-xs text-slate-400">{membros.length} time{membros.length !== 1 ? 's' : ''}</span>
            </div>
            {membros.length === 0 ? (
              <p className="px-6 py-3 text-xs text-slate-400 italic">Nenhum time neste grupo.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {membros.map((team) => (
                  <InLeagueItem
                    key={team.id}
                    team={team}
                    leagueId={leagueId}
                    tipo="grupos"
                    numeroGrupos={numeroGrupos}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {semGrupo.length > 0 && (
        <div>
          <div className="bg-amber-50 px-6 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              Sem grupo ({semGrupo.length})
            </span>
          </div>
          <ul className="divide-y divide-slate-50">
            {semGrupo.map((team) => (
              <InLeagueItem
                key={team.id}
                team={team}
                leagueId={leagueId}
                tipo="grupos"
                numeroGrupos={numeroGrupos}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function LeagueTeamsPanel({
  leagueId,
  tipo,
  numeroGrupos,
  inLeague,
  outLeague,
  noTeams,
}: {
  leagueId: string
  tipo: LeagueTipo
  numeroGrupos: number | null
  inLeague: Team[]
  outLeague: Team[]
  noTeams: boolean
}) {
  if (noTeams) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Nenhum time cadastrado ainda.</p>
        <Link
          href="/admin/times"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Cadastrar times
        </Link>
      </div>
    )
  }

  const isGrupos = tipo === 'grupos'

  return (
    <>
      {/* Times na liga */}
      <div className="mb-8 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-800">
            Times na liga
            <span className="ml-2 text-sm font-normal text-gray-400">({inLeague.length})</span>
          </h2>
          {isGrupos && numeroGrupos && (
            <p className="mt-0.5 text-xs text-slate-400">
              {numeroGrupos} grupo{numeroGrupos > 1 ? 's' : ''} · use o seletor para mover times entre grupos
            </p>
          )}
        </div>

        {inLeague.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Nenhum time adicionado ainda.
          </p>
        ) : isGrupos && numeroGrupos ? (
          <GrupoView leagueId={leagueId} inLeague={inLeague} numeroGrupos={numeroGrupos} />
        ) : (
          <ul className="divide-y divide-slate-50">
            {inLeague.map((team) => (
              <InLeagueItem
                key={team.id}
                team={team}
                leagueId={leagueId}
                tipo={tipo}
                numeroGrupos={numeroGrupos}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Times disponíveis */}
      {outLeague.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-slate-800">
              Adicionar times
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({outLeague.length} disponíveis)
              </span>
            </h2>
            {isGrupos && (
              <p className="mt-0.5 text-xs text-slate-400">
                Selecione o grupo antes de adicionar o time
              </p>
            )}
          </div>

          <ul className="divide-y divide-slate-50">
            {outLeague.map((team) => (
              <OutLeagueItem
                key={team.id}
                team={team}
                leagueId={leagueId}
                tipo={tipo}
                numeroGrupos={numeroGrupos}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
