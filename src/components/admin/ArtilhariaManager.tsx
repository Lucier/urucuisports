'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import {
  upsertArtilhariaAction,
  deleteArtilhariaAction,
  type ArtilhariaFormState,
} from '@/app/admin/artilharia/actions'

type League = { id: string; name: string }
type Team = { id: string; name: string; leagueId: string | null }

type Artilheiro = {
  id: string
  nomeJogador: string
  leagueId: string
  leagueName: string
  teamId: string
  teamName: string
  fotoUrl: string | null
  gols: number
}

const initialState: ArtilhariaFormState = {}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const selectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-400'

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar artilheiro'}
    </button>
  )
}

export function ArtilhariaManager({
  artilheiros,
  totalCount,
  leagues,
  teams,
}: {
  artilheiros: Artilheiro[]
  totalCount: number
  leagues: League[]
  teams: Team[]
}) {
  const [state, formAction] = useActionState(upsertArtilhariaAction, initialState)
  const [editing, setEditing] = useState<Artilheiro | null>(null)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('')
  const [fotoPreview, setFotoPreview] = useState<string>('')
  const didMount = useRef(false)

  const filteredTeams = selectedLeagueId
    ? teams.filter((t) => t.leagueId === selectedLeagueId)
    : []

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    if (state.success) {
      setEditing(null)
      setSelectedLeagueId('')
      setFotoPreview('')
    }
  }, [state])

  function startEdit(artilheiro: Artilheiro) {
    setEditing(artilheiro)
    setSelectedLeagueId(artilheiro.leagueId)
    setFotoPreview(artilheiro.fotoUrl ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
    setSelectedLeagueId('')
    setFotoPreview('')
  }

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar artilheiro' : 'Novo artilheiro'}
        </h2>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome do jogador <span className="text-red-500">*</span>
            </label>
            <input
              name="nomeJogador"
              required
              defaultValue={editing?.nomeJogador ?? ''}
              key={editing?.id ?? 'new-nome'}
              className={inputCls}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Liga <span className="text-red-500">*</span>
              </label>
              <select
                name="leagueId"
                required
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className={selectCls}
              >
                <option value="" disabled>Selecione uma liga…</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Time <span className="text-red-500">*</span>
              </label>
              <select
                name="teamId"
                required
                disabled={!selectedLeagueId}
                defaultValue={editing?.teamId ?? ''}
                key={`team-${selectedLeagueId}`}
                className={selectCls}
              >
                <option value="" disabled>
                  {selectedLeagueId ? 'Selecione um time…' : 'Selecione a liga primeiro'}
                </option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Gols <span className="text-red-500">*</span>
            </label>
            <input
              name="gols"
              type="number"
              required
              min={0}
              defaultValue={editing?.gols ?? 0}
              key={editing?.id ?? 'new-gols'}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Foto do jogador
              <span className="ml-1 text-xs font-normal text-slate-400">(URL — opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              {fotoPreview && (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <Image
                    src={fotoPreview}
                    alt="Preview"
                    fill
                    sizes="48px"
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                  />
                </div>
              )}
              <input
                name="fotoUrl"
                type="url"
                defaultValue={editing?.fotoUrl ?? ''}
                key={editing?.id ?? 'new-foto'}
                className={inputCls}
                placeholder="https://..."
                onChange={(e) => setFotoPreview(e.target.value)}
              />
            </div>
          </div>

          {state.error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <SubmitButton editing={!!editing} />
            {editing && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista */}
      {totalCount > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Artilheiros cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Mobile */}
            <ul className="divide-y divide-slate-50 sm:hidden">
              {artilheiros.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{a.nomeJogador}</p>
                      <p className="text-xs text-slate-500">{a.teamName}</p>
                      <p className="text-xs text-slate-400">{a.leagueName}</p>
                    </div>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                      {a.gols}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Editar
                    </button>
                    <form action={deleteArtilhariaAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          if (!confirm(`Excluir "${a.nomeJogador}"?`)) e.preventDefault()
                        }}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Jogador</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Liga</th>
                    <th className="px-4 py-3 text-center">Gols</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {artilheiros.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{a.nomeJogador}</td>
                      <td className="px-4 py-3 text-slate-600">{a.teamName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.leagueName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                          {a.gols}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(a)}
                            className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Editar
                          </button>
                          <form action={deleteArtilhariaAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <button
                              type="submit"
                              className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                if (!confirm(`Excluir "${a.nomeJogador}"?`)) e.preventDefault()
                              }}
                            >
                              Excluir
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
