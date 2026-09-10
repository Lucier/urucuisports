'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createRoundAction,
  deleteRoundAction,
  createMatchAction,
  deleteMatchAction,
  updateMatchScoreAction,
  createKnockoutRoundAction,
  type RoundFormState,
  type MatchFormState,
} from '@/app/admin/rodadas/actions'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeagueTipo = 'pontos_corridos' | 'grupos'

type Team = {
  id: string
  name: string
  logoUrl: string | null
  grupo: number | null
}

type Player = {
  id: string
  name: string
  teamId: string
}

type MatchGoal = {
  matchId: string
  playerId: string
  teamId: string
  goals: number
}

type MatchRow = {
  id: string
  roundId: string | null
  homeTeamId: string
  homeTeamName: string | null
  homeTeamLogo: string | null
  awayTeamId: string
  awayTeamName: string | null
  awayTeamLogo: string | null
  homeScore: number | null
  awayScore: number | null
  status: string
  date: Date
  streamUrl: string | null
  goals: MatchGoal[]
}

type Round = {
  id: string
  numero: number
  nome: string | null
  grupo: number | null
  matches: MatchRow[]
}

type League = {
  id: string
  name: string
  tipo: LeagueTipo
  numeroGrupos: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function grupoLabel(n: number) {
  return String.fromCharCode(64 + n)
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Agendado', cls: 'bg-slate-100 text-slate-600' },
  LIVE:      { label: 'Ao vivo',  cls: 'bg-red-100 text-red-700' },
  FINISHED:  { label: 'Encerrado', cls: 'bg-emerald-100 text-emerald-700' },
  POSTPONED: { label: 'Adiado',   cls: 'bg-amber-100 text-amber-700' },
}

const selectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

// ─── Sub-buttons ──────────────────────────────────────────────────────────────

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : label}
    </button>
  )
}

// ─── TeamAvatar ───────────────────────────────────────────────────────────────

function TeamAvatar({ name, logo }: { name: string | null; logo: string | null }) {
  return (
    <div className="relative h-6 w-6 flex-shrink-0">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
        {(name ?? '?').charAt(0)}
      </div>
      {logo && (
        <Image
          src={logo}
          alt={name ?? ''}
          fill
          sizes="24px"
          className="rounded-full border border-slate-100 object-contain bg-slate-50"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

// ─── MatchScoreModal ──────────────────────────────────────────────────────────

type ScorerEntry = { playerId: string; teamId: string; goals: number }

function GoalSelector({
  label,
  teamPlayers,
  teamId,
  scorers,
  onAdd,
  onRemove,
  allPlayers,
}: {
  label: string
  teamPlayers: Player[]
  teamId: string
  scorers: ScorerEntry[]
  onAdd: (entry: ScorerEntry) => void
  onRemove: (playerId: string) => void
  allPlayers: Player[]
}) {
  const [selectedId, setSelectedId] = useState('')
  const [qty, setQty] = useState(1)

  const teamScorers = scorers.filter((s) => s.teamId === teamId)
  const addedIds = new Set(teamScorers.map((s) => s.playerId))
  const available = teamPlayers.filter((p) => !addedIds.has(p.id))

  function handleAdd() {
    if (!selectedId) return
    onAdd({ playerId: selectedId, teamId, goals: qty })
    setSelectedId('')
    setQty(1)
  }

  return (
    <div>
      <p className="mb-2 truncate text-xs font-semibold text-slate-700">{label}</p>

      {teamPlayers.length === 0 ? (
        <p className="text-xs italic text-slate-400">
          Nenhum jogador cadastrado.{' '}
          <a href="/admin/jogadores" className="underline hover:text-slate-600">
            Adicionar
          </a>
        </p>
      ) : (
        <div className="space-y-2">
          {/* Select + qty + botão */}
          <div className="flex gap-1.5">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Jogador…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-12 rounded-lg border border-slate-200 px-1 py-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedId}
              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              +
            </button>
          </div>

          {/* Chips dos artilheiros adicionados */}
          {teamScorers.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {teamScorers.map((s) => {
                const p = allPlayers.find((pl) => pl.id === s.playerId)
                return (
                  <li
                    key={s.playerId}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 pl-2.5 pr-1 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    ⚽ {p?.name ?? '—'}{s.goals > 1 && ` (${s.goals})`}
                    <button
                      type="button"
                      onClick={() => onRemove(s.playerId)}
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
                      aria-label="Remover"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function MatchScoreModal({
  match,
  players,
  onClose,
}: {
  match: MatchRow
  players: Player[]
  onClose: () => void
}) {
  const [state, formAction] = useActionState(updateMatchScoreAction, {})

  const [scorers, setScorers] = useState<ScorerEntry[]>(
    match.goals.map((g) => ({ playerId: g.playerId, teamId: g.teamId, goals: g.goals })),
  )

  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [state])

  const homePlayers = players.filter((p) => p.teamId === match.homeTeamId)
  const awayPlayers = players.filter((p) => p.teamId === match.awayTeamId)

  function addScorer(entry: ScorerEntry) {
    setScorers((prev) => {
      const existing = prev.find((s) => s.playerId === entry.playerId)
      if (existing) {
        return prev.map((s) =>
          s.playerId === entry.playerId ? { ...s, goals: s.goals + entry.goals } : s,
        )
      }
      return [...prev, entry]
    })
  }

  function removeScorer(playerId: string) {
    setScorers((prev) => prev.filter((s) => s.playerId !== playerId))
  }

  const scoreInputCls =
    'w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-lg font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">Editar placar</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="matchId" value={match.id} />

          {/* Hidden inputs dos artilheiros para o server action */}
          {scorers.map((s) => (
            <input
              key={s.playerId}
              type="hidden"
              name={`goal_${s.playerId}:${s.teamId}`}
              value={s.goals}
            />
          ))}

          <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
            {/* Placar */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Resultado</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-1 flex-col items-end gap-1">
                  <TeamAvatar name={match.homeTeamName} logo={match.homeTeamLogo} />
                  <span className="text-right text-sm font-semibold text-slate-700">
                    {match.homeTeamName ?? '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    name="homeScore"
                    type="number"
                    min={0}
                    max={99}
                    defaultValue={match.homeScore ?? ''}
                    placeholder="–"
                    className={scoreInputCls}
                  />
                  <span className="font-bold text-slate-300">×</span>
                  <input
                    name="awayScore"
                    type="number"
                    min={0}
                    max={99}
                    defaultValue={match.awayScore ?? ''}
                    placeholder="–"
                    className={scoreInputCls}
                  />
                </div>

                <div className="flex flex-1 flex-col items-start gap-1">
                  <TeamAvatar name={match.awayTeamName} logo={match.awayTeamLogo} />
                  <span className="text-sm font-semibold text-slate-700">
                    {match.awayTeamName ?? '—'}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                <select name="status" defaultValue={match.status} className={selectCls}>
                  <option value="SCHEDULED">Agendado</option>
                  <option value="LIVE">Ao vivo</option>
                  <option value="FINISHED">Encerrado</option>
                  <option value="POSTPONED">Adiado</option>
                </select>
              </div>

              {/* Link de transmissão */}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Link de transmissão
                  <span className="ml-1 font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  type="url"
                  name="streamUrl"
                  defaultValue={match.streamUrl ?? ''}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Artilheiros via select */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Artilheiros
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GoalSelector
                  label={match.homeTeamName ?? 'Casa'}
                  teamPlayers={homePlayers}
                  teamId={match.homeTeamId}
                  scorers={scorers}
                  onAdd={addScorer}
                  onRemove={removeScorer}
                  allPlayers={players}
                />
                <GoalSelector
                  label={match.awayTeamName ?? 'Visitante'}
                  teamPlayers={awayPlayers}
                  teamId={match.awayTeamId}
                  scorers={scorers}
                  onAdd={addScorer}
                  onRemove={removeScorer}
                  allPlayers={players}
                />
              </div>
            </div>

            {/* Feedback */}
            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
            )}
            {state.success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>
            <SaveBtn label="Salvar placar" />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MatchItem ────────────────────────────────────────────────────────────────

function MatchItem({ match, players }: { match: MatchRow; players: Player[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const badge = STATUS_LABELS[match.status] ?? STATUS_LABELS.SCHEDULED

  const homeScorers = match.goals
    .filter((g) => g.teamId === match.homeTeamId && g.goals > 0)
    .map((g) => {
      const p = players.find((pl) => pl.id === g.playerId)
      return p ? `${p.name}${g.goals > 1 ? ` (${g.goals})` : ''}` : null
    })
    .filter(Boolean) as string[]

  const awayScorers = match.goals
    .filter((g) => g.teamId === match.awayTeamId && g.goals > 0)
    .map((g) => {
      const p = players.find((pl) => pl.id === g.playerId)
      return p ? `${p.name}${g.goals > 1 ? ` (${g.goals})` : ''}` : null
    })
    .filter(Boolean) as string[]

  const hasScorers = homeScorers.length > 0 || awayScorers.length > 0

  return (
    <>
      <li className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
        {/* Linha principal: times + placar */}
        <div className="flex items-center gap-2">
          {/* Casa */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <span className="truncate text-right text-xs font-medium leading-tight text-slate-800 sm:text-sm">
              {match.homeTeamName ?? '—'}
            </span>
            <TeamAvatar name={match.homeTeamName} logo={match.homeTeamLogo} />
          </div>

          {/* Placar / VS */}
          <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
            {match.homeScore !== null && match.awayScore !== null ? (
              <span className="font-bold text-slate-800 tabular-nums">
                {match.homeScore} × {match.awayScore}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">VS</span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {/* Visitante */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <TeamAvatar name={match.awayTeamName} logo={match.awayTeamLogo} />
            <span className="truncate text-xs font-medium leading-tight text-slate-800 sm:text-sm">
              {match.awayTeamName ?? '—'}
            </span>
          </div>
        </div>

        {/* Artilheiros alinhados sob cada time */}
        {hasScorers && (
          <div className="mt-1 flex items-start gap-2">
            <div className="flex min-w-0 flex-1 justify-end">
              {homeScorers.length > 0 && (
                <ul className="space-y-0.5 text-right">
                  {homeScorers.map((name) => (
                    <li key={name} className="text-[11px] text-slate-400">
                      ⚽ {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Espaço central alinhado com o placar */}
            <div className="flex-shrink-0 w-16" />
            <div className="flex min-w-0 flex-1 justify-start">
              {awayScorers.length > 0 && (
                <ul className="space-y-0.5">
                  {awayScorers.map((name) => (
                    <li key={name} className="text-[11px] text-slate-400">
                      ⚽ {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Linha secundária: data + transmissão + ações */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[11px] text-slate-400">
              {formatDate(match.date)}
            </span>
            {match.streamUrl && (
              <a
                href={match.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[11px] font-medium text-sky-600 hover:underline"
              >
                📺 Assistir transmissão
              </a>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700"
              title="Editar placar e artilheiros"
            >
              Placar
            </button>
            <form action={deleteMatchAction}>
              <input type="hidden" name="id" value={match.id} />
              <button
                type="submit"
                className="rounded px-1.5 py-1 text-xs text-red-400 hover:bg-red-50"
                onClick={(e) => { if (!confirm('Excluir confronto?')) e.preventDefault() }}
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      </li>

      {modalOpen && (
        <MatchScoreModal
          match={match}
          players={players}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

// ─── AddMatchForm ─────────────────────────────────────────────────────────────

function AddMatchForm({
  round,
  leagueId,
  teams,
  onCancel,
  state,
  formAction,
}: {
  round: Round
  leagueId: string
  teams: Team[]
  onCancel: () => void
  state: MatchFormState
  formAction: (payload: FormData) => void
}) {
  const eligible = round.grupo !== null
    ? teams.filter((t) => t.grupo === round.grupo)
    : teams

  const [homeId, setHomeId] = useState('')

  useEffect(() => {
    if (state.success) {
      onCancel()
    }
  }, [state])

  return (
    <form action={formAction} className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Novo confronto</p>

      <input type="hidden" name="roundId" value={round.id} />
      <input type="hidden" name="leagueId" value={leagueId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Time da casa <span className="text-red-500">*</span>
          </label>
          <select
            name="homeTeamId"
            required
            value={homeId}
            onChange={(e) => setHomeId(e.target.value)}
            className={selectCls}
          >
            <option value="" disabled>Selecione…</option>
            {eligible.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Time visitante <span className="text-red-500">*</span>
          </label>
          <select
            name="awayTeamId"
            required
            className={selectCls}
          >
            <option value="" disabled>Selecione…</option>
            {eligible
              .filter((t) => t.id !== homeId)
              .map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Data e hora <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="date"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Link de transmissão
          <span className="ml-1 font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="url"
          name="streamUrl"
          placeholder="https://..."
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
      )}

      <div className="flex gap-2">
        <SaveBtn label="Adicionar confronto" />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── RoundCard ────────────────────────────────────────────────────────────────

function RoundCard({
  round,
  leagueId,
  teams,
  players,
  isAddingMatch,
  onToggleAdd,
  matchState,
  matchAction,
}: {
  round: Round
  leagueId: string
  teams: Team[]
  players: Player[]
  isAddingMatch: boolean
  onToggleAdd: () => void
  matchState: MatchFormState
  matchAction: (payload: FormData) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Cabeçalho da rodada */}
      <div className="flex items-center gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {round.numero}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {round.nome ? round.nome : `Rodada ${round.numero}`}
            </p>
            <p className="text-xs text-slate-400">
              {round.matches.length} confronto{round.matches.length !== 1 ? 's' : ''}
            </p>
          </div>
          <svg
            className={`ml-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Ações da rodada */}
        <button
          type="button"
          onClick={onToggleAdd}
          className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          + Confronto
        </button>
        <form action={deleteRoundAction}>
          <input type="hidden" name="id" value={round.id} />
          <button
            type="submit"
            className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50"
            onClick={(e) => {
              if (!confirm(`Excluir rodada ${round.numero}? Os confrontos também serão removidos.`))
                e.preventDefault()
            }}
          >
            Excluir
          </button>
        </form>
      </div>

      {/* Confrontos */}
      {expanded && (
        <div className="border-t border-slate-50 px-5 pb-4">
          {round.matches.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Nenhum confronto ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {round.matches.map((m) => (
                <MatchItem key={m.id} match={m} players={players} />
              ))}
            </ul>
          )}

          {isAddingMatch && (
            <AddMatchForm
              round={round}
              leagueId={leagueId}
              teams={teams}
              onCancel={onToggleAdd}
              state={matchState}
              formAction={matchAction}
            />
          )}
        </div>
      )}

      {/* Form de confronto fora do expand */}
      {!expanded && isAddingMatch && (
        <div className="border-t border-slate-50 px-5 pb-4">
          <AddMatchForm
            round={round}
            leagueId={leagueId}
            teams={teams}
            onCancel={onToggleAdd}
            state={matchState}
            formAction={matchAction}
          />
        </div>
      )}
    </div>
  )
}

// ─── CreateRoundForm ──────────────────────────────────────────────────────────

function CreateRoundForm({
  leagueId,
  grupo,
  state,
  formAction,
}: {
  leagueId: string
  grupo: number | null
  state: RoundFormState
  formAction: (payload: FormData) => void
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova rodada
        {grupo !== null && ` — Grupo ${grupoLabel(grupo)}`}
      </button>
    )
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Nova rodada{grupo !== null ? ` — Grupo ${grupoLabel(grupo)}` : ''}
      </p>

      <input type="hidden" name="leagueId" value={leagueId} />
      {grupo !== null && <input type="hidden" name="grupo" value={grupo} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Nome da rodada
          <span className="ml-1 text-slate-400 font-normal">(opcional — ex: Semifinal)</span>
        </label>
        <input
          name="nome"
          type="text"
          placeholder="Deixe em branco para usar o número automaticamente"
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
      )}

      <div className="flex gap-2">
        <SaveBtn label="Criar rodada" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── GroupStandings ───────────────────────────────────────────────────────────

function GroupStandings({ rounds, teams }: { rounds: Round[]; teams: Team[] }) {
  type Entry = { id: string; name: string; pts: number; gd: number; gf: number; played: number }

  const map = new Map<string, Entry>()
  for (const t of teams) {
    map.set(t.id, { id: t.id, name: t.name, pts: 0, gd: 0, gf: 0, played: 0 })
  }

  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.status !== 'FINISHED' || m.homeScore === null || m.awayScore === null) continue
      const home = map.get(m.homeTeamId)
      const away = map.get(m.awayTeamId)
      if (!home || !away) continue
      const hs = m.homeScore
      const as_ = m.awayScore
      home.gf += hs; home.gd += hs - as_; home.played++
      away.gf += as_; away.gd += as_ - hs; away.played++
      if (hs > as_) { home.pts += 3 }
      else if (hs < as_) { away.pts += 3 }
      else { home.pts += 1; away.pts += 1 }
    }
  }

  const rows = [...map.values()].sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf,
  )

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Classificação</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="w-6 px-2 py-1.5 text-center">#</th>
            <th className="px-2 py-1.5 text-left">Time</th>
            <th className="px-2 py-1.5 text-center">J</th>
            <th className="px-2 py-1.5 text-center">SG</th>
            <th className="px-2 py-1.5 text-center font-bold text-slate-500">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => {
            const isTop2 = i < 2
            const isLast = i === rows.length - 1 && rows.length > 1
            return (
              <tr
                key={row.id}
                className={`border-l-2 ${isTop2 ? 'border-l-emerald-500 bg-emerald-50/40' : isLast ? 'border-l-red-400 bg-red-50/30' : 'border-l-transparent'}`}
              >
                <td className="px-2 py-1.5 text-center font-semibold text-slate-500">{i + 1}</td>
                <td className={`px-2 py-1.5 font-semibold ${isTop2 ? 'text-emerald-800' : isLast ? 'text-red-600' : 'text-slate-700'}`}>
                  {row.name}
                  {i === 0 && <span className="ml-1 text-[9px] font-bold uppercase text-emerald-500">1º</span>}
                  {i === 1 && <span className="ml-1 text-[9px] font-bold uppercase text-emerald-500">2º</span>}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-400">{row.played}</td>
                <td className="px-2 py-1.5 text-center text-slate-400">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className="px-2 py-1.5 text-center font-bold text-slate-800">{row.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── GroupSection ─────────────────────────────────────────────────────────────

function GroupSection({
  grupo,
  rounds,
  leagueId,
  teams,
  players,
  activeMatchRound,
  onToggleMatch,
  matchState,
  matchAction,
  roundState,
  roundAction,
}: {
  grupo: number
  rounds: Round[]
  leagueId: string
  teams: Team[]
  players: Player[]
  activeMatchRound: string | null
  onToggleMatch: (id: string) => void
  matchState: MatchFormState
  matchAction: (payload: FormData) => void
  roundState: RoundFormState
  roundAction: (payload: FormData) => void
}) {
  const groupTeams = teams.filter((t) => t.grupo === grupo)
  const label = grupoLabel(grupo)

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
          {label}
        </span>
        <div>
          <h3 className="font-bold text-slate-800">Grupo {label}</h3>
          <p className="text-xs text-slate-400">
            {groupTeams.length} time{groupTeams.length !== 1 ? 's' : ''}
            {groupTeams.length > 0 && (
              <> · {groupTeams.map((t) => t.name).join(', ')}</>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rounds.map((r) => (
          <RoundCard
            key={r.id}
            round={r}
            leagueId={leagueId}
            teams={teams}
            players={players}
            isAddingMatch={activeMatchRound === r.id}
            onToggleAdd={() => onToggleMatch(r.id)}
            matchState={matchState}
            matchAction={matchAction}
          />
        ))}

        <GroupStandings rounds={rounds} teams={groupTeams} />

        <CreateRoundForm
          leagueId={leagueId}
          grupo={grupo}
          state={roundState}
          formAction={roundAction}
        />
      </div>
    </div>
  )
}

// ─── KnockoutBracketForm ──────────────────────────────────────────────────────

const FASE_PRESETS = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', '3º Lugar', 'Final']

function computeClassified(allGroupRounds: Round[], teams: Team[]) {
  const stats = new Map<string, { pts: number; gd: number; gf: number }>()
  for (const t of teams) stats.set(t.id, { pts: 0, gd: 0, gf: 0 })

  for (const r of allGroupRounds) {
    for (const m of r.matches) {
      if (m.status !== 'FINISHED' || m.homeScore == null || m.awayScore == null) continue
      const home = stats.get(m.homeTeamId)
      const away = stats.get(m.awayTeamId)
      if (!home || !away) continue
      home.gf += m.homeScore; home.gd += m.homeScore - m.awayScore
      away.gf += m.awayScore; away.gd += m.awayScore - m.homeScore
      if (m.homeScore > m.awayScore) home.pts += 3
      else if (m.homeScore < m.awayScore) away.pts += 3
      else { home.pts += 1; away.pts += 1 }
    }
  }

  const byGroup = new Map<number, Team[]>()
  for (const t of teams) {
    if (t.grupo == null) continue
    if (!byGroup.has(t.grupo)) byGroup.set(t.grupo, [])
    byGroup.get(t.grupo)!.push(t)
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a - b)
    .map(([grupo, gTeams]) => {
      const sorted = [...gTeams].sort((a, b) => {
        const sa = stats.get(a.id)!
        const sb = stats.get(b.id)!
        if (sb.pts !== sa.pts) return sb.pts - sa.pts
        if (sb.gd !== sa.gd) return sb.gd - sa.gd
        return sb.gf - sa.gf
      })
      return {
        grupo,
        first: sorted[0] ?? null,
        second: sorted[1] ?? null,
        pts: (id: string) => stats.get(id)?.pts ?? 0,
      }
    })
}

function KnockoutBracketForm({
  leagueId,
  allGroupRounds,
  teams,
}: {
  leagueId: string
  allGroupRounds: Round[]
  teams: Team[]
}) {
  const [state, formAction] = useActionState(createKnockoutRoundAction, {})
  const [open, setOpen] = useState(false)
  const [roundName, setRoundName] = useState('')
  const [matchups, setMatchups] = useState<{ home: string; away: string }[]>([{ home: '', away: '' }])

  const classified = computeClassified(allGroupRounds, teams)

  function addMatchup() {
    setMatchups((prev) => [...prev, { home: '', away: '' }])
  }
  function removeMatchup(i: number) {
    setMatchups((prev) => prev.filter((_, idx) => idx !== i))
  }
  function setHome(i: number, v: string) {
    setMatchups((prev) => prev.map((m, idx) => idx === i ? { ...m, home: v } : m))
  }
  function setAway(i: number, v: string) {
    setMatchups((prev) => prev.map((m, idx) => idx === i ? { ...m, away: v } : m))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-700 transition hover:border-amber-400 hover:text-amber-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova rodada de mata-mata
      </button>
    )
  }

  return (
    <form action={formAction} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Nova rodada de mata-mata</p>

      <input type="hidden" name="leagueId" value={leagueId} />
      <input type="hidden" name="matchCount" value={matchups.length} />
      {matchups.map((m, i) => (
        <input key={`h${i}`} type="hidden" name={`match_home_${i}`} value={m.home} />
      ))}
      {matchups.map((m, i) => (
        <input key={`a${i}`} type="hidden" name={`match_away_${i}`} value={m.away} />
      ))}

      {/* Classificados por grupo — referência */}
      {classified.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Classificados por grupo</p>
          <div className="flex flex-wrap gap-2">
            {classified.map((g) => (
              <div key={g.grupo} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                <span className="mb-1 flex items-center gap-1 font-bold text-slate-500">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white">
                    {String.fromCharCode(64 + g.grupo)}
                  </span>
                  Grupo {String.fromCharCode(64 + g.grupo)}
                </span>
                <p className="text-emerald-700 font-semibold">
                  1º {g.first?.name ?? <span className="italic text-slate-400">—</span>}
                  {g.first && <span className="ml-1 text-[10px] text-slate-400">({g.pts(g.first.id)}pts)</span>}
                </p>
                <p className="text-slate-600 font-medium">
                  2º {g.second?.name ?? <span className="italic text-slate-400">—</span>}
                  {g.second && <span className="ml-1 text-[10px] text-slate-400">({g.pts(g.second.id)}pts)</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confrontos */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Confrontos</p>
        <div className="space-y-2">
          {matchups.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 flex-shrink-0 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
              <select
                value={m.home}
                onChange={(e) => setHome(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="">Casa…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.grupo ? ` (G${String.fromCharCode(64 + t.grupo)})` : ''}</option>
                ))}
              </select>
              <span className="flex-shrink-0 text-xs font-bold text-slate-300">×</span>
              <select
                value={m.away}
                onChange={(e) => setAway(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="">Visitante…</option>
                {teams
                  .filter((t) => t.id !== m.home)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.grupo ? ` (G${String.fromCharCode(64 + t.grupo)})` : ''}</option>
                  ))}
              </select>
              {matchups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMatchup(i)}
                  className="rounded px-1.5 py-1 text-xs text-red-400 hover:bg-red-50"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMatchup}
          className="mt-2 text-xs font-medium text-amber-700 hover:underline"
        >
          + Adicionar confronto
        </button>
      </div>

      {/* Nome e data */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Nome da fase <span className="text-red-500">*</span>
          </label>
          <input
            name="roundName"
            type="text"
            required
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            placeholder="Ex: Semifinal, Quartas…"
            className={inputCls}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {FASE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRoundName(p)}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                  roundName === p
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Data dos confrontos <span className="text-red-500">*</span>
          </label>
          <input type="datetime-local" name="date" required className={inputCls} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
      )}

      <div className="flex gap-2">
        <SaveBtn label="Criar rodada" />
        <button
          type="button"
          onClick={() => { setOpen(false); setRoundName(''); setMatchups([{ home: '', away: '' }]) }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── FaseFinalSection ─────────────────────────────────────────────────────────

function FaseFinalSection({
  rounds,
  allGroupRounds,
  leagueId,
  teams,
  players,
  activeMatchRound,
  onToggleMatch,
  matchState,
  matchAction,
}: {
  rounds: Round[]
  allGroupRounds: Round[]
  leagueId: string
  teams: Team[]
  players: Player[]
  activeMatchRound: string | null
  onToggleMatch: (id: string) => void
  matchState: MatchFormState
  matchAction: (payload: FormData) => void
}) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-base">🏆</span>
        <div>
          <h3 className="font-bold text-slate-800">Fase Final</h3>
          <p className="text-xs text-slate-400">Rodadas eliminatórias — monte os confrontos manualmente</p>
        </div>
      </div>

      <div className="space-y-3">
        {rounds.length === 0 && (
          <p className="rounded-lg border border-dashed border-amber-200 py-4 text-center text-xs text-amber-600">
            Nenhuma fase eliminatória criada ainda.
          </p>
        )}

        {rounds.map((r) => (
          <RoundCard
            key={r.id}
            round={r}
            leagueId={leagueId}
            teams={teams}
            players={players}
            isAddingMatch={activeMatchRound === r.id}
            onToggleAdd={() => onToggleMatch(r.id)}
            matchState={matchState}
            matchAction={matchAction}
          />
        ))}

        <KnockoutBracketForm leagueId={leagueId} allGroupRounds={allGroupRounds} teams={teams} />
      </div>
    </div>
  )
}

// ─── RoundManager (principal) ─────────────────────────────────────────────────

export function RoundManager({
  league,
  rounds,
  teams,
  players,
}: {
  league: League
  rounds: Round[]
  teams: Team[]
  players: Player[]
}) {
  const [roundState, roundAction] = useActionState(createRoundAction, {})
  const [matchState, matchAction] = useActionState(createMatchAction, {})
  const [activeMatchRound, setActiveMatchRound] = useState<string | null>(null)

  function toggleMatch(roundId: string) {
    setActiveMatchRound((prev) => (prev === roundId ? null : roundId))
  }

  const isGrupos = league.tipo === 'grupos'

  if (!isGrupos) {
    return (
      <div className="space-y-4">
        {rounds.map((r) => (
          <RoundCard
            key={r.id}
            round={r}
            leagueId={league.id}
            teams={teams}
            players={players}
            isAddingMatch={activeMatchRound === r.id}
            onToggleAdd={() => toggleMatch(r.id)}
            matchState={matchState}
            matchAction={matchAction}
          />
        ))}

        <CreateRoundForm
          leagueId={league.id}
          grupo={null}
          state={roundState}
          formAction={roundAction}
        />

        {teams.length === 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Nenhum time na liga ainda. Adicione times em{' '}
            <a href="/admin/ligas" className="underline">
              Ligas → Times
            </a>
            .
          </div>
        )}
      </div>
    )
  }

  const numGrupos = league.numeroGrupos ?? 0
  const grupos = Array.from({ length: numGrupos }, (_, i) => i + 1)
  const allGroupRounds = rounds.filter((r) => r.grupo !== null)
  const faseFinalRounds = rounds.filter((r) => r.grupo === null)

  return (
    <div className="space-y-6">
      {grupos.map((g) => {
        const grupoRounds = rounds.filter((r) => r.grupo === g)
        return (
          <GroupSection
            key={g}
            grupo={g}
            rounds={grupoRounds}
            leagueId={league.id}
            teams={teams}
            players={players}
            activeMatchRound={activeMatchRound}
            onToggleMatch={toggleMatch}
            matchState={matchState}
            matchAction={matchAction}
            roundState={roundState}
            roundAction={roundAction}
          />
        )
      })}

      {numGrupos > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fase eliminatória</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      <FaseFinalSection
        rounds={faseFinalRounds}
        allGroupRounds={allGroupRounds}
        leagueId={league.id}
        teams={teams}
        players={players}
        activeMatchRound={activeMatchRound}
        onToggleMatch={toggleMatch}
        matchState={matchState}
        matchAction={matchAction}
      />

      {teams.length === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Nenhum time na liga ainda. Adicione times em{' '}
          <a href="/admin/ligas" className="underline">
            Ligas → Times
          </a>
          .
        </div>
      )}
    </div>
  )
}
