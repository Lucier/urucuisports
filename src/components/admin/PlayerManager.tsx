'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { upsertPlayerAction, deletePlayerAction, type PlayerFormState } from '@/app/admin/jogadores/actions'

const POSITIONS = [
  'Goleiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Zagueiro',
  'Volante',
  'Meia',
  'Meia-atacante',
  'Ponta Direita',
  'Ponta Esquerda',
  'Centroavante',
]

type Player = {
  id: string
  name: string
  position: string
  photoUrl: string | null
  teamId: string
}

const initialState: PlayerFormState = {}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar jogador'}
    </button>
  )
}

function PlayerAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        {name.charAt(0).toUpperCase()}
      </div>
      {photoUrl && (
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="40px"
          className="rounded-full border border-slate-100 object-cover bg-slate-50"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

export function PlayerManager({ players, teamId, totalCount }: { players: Player[]; teamId: string; totalCount: number }) {
  const [state, formAction] = useActionState(upsertPlayerAction, initialState)
  const [editing, setEditing] = useState<Player | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')

  function startEdit(player: Player) {
    setEditing(player)
    setPhotoPreview(player.photoUrl ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
    setPhotoPreview('')
  }

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar jogador' : 'Novo jogador'}
        </h2>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="teamId" value={teamId} />
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ''}
                key={editing?.id ?? 'new-name'}
                className={inputCls}
                placeholder="Ex: Gabriel Barbosa"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Posição <span className="text-red-500">*</span>
              </label>
              <select
                name="position"
                required
                defaultValue={editing?.position ?? ''}
                key={editing?.id ?? 'new-position'}
                className={inputCls}
              >
                <option value="" disabled>Selecione…</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL da foto
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              {(photoPreview || editing?.photoUrl) && (
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src={photoPreview || editing?.photoUrl || ''}
                    alt=""
                    fill
                    sizes="40px"
                    className="rounded-full border border-slate-100 object-cover bg-slate-50"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                  />
                </div>
              )}
              <input
                name="photoUrl"
                type="url"
                defaultValue={editing?.photoUrl ?? ''}
                key={editing?.id ?? 'new-photo'}
                className={inputCls}
                placeholder="https://..."
                onChange={(e) => setPhotoPreview(e.target.value)}
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
      {players.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">Nenhum jogador cadastrado ainda.</p>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Elenco
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount} jogadores)</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Mobile: card list */}
            <ul className="divide-y divide-slate-50 sm:hidden">
              {players.map((player) => (
                <li key={player.id} className="flex items-center gap-3 px-4 py-3">
                  <PlayerAvatar name={player.name} photoUrl={player.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{player.name}</p>
                    <p className="text-xs text-slate-500">{player.position}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(player)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Editar
                    </button>
                    <form action={deletePlayerAction}>
                      <input type="hidden" name="id" value={player.id} />
                      <input type="hidden" name="teamId" value={teamId} />
                      <button
                        type="submit"
                        className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={(e) => { if (!confirm(`Excluir "${player.name}"?`)) e.preventDefault() }}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Jogador</th>
                    <th className="px-4 py-3 text-left">Posição</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar name={player.name} photoUrl={player.photoUrl} />
                          <span className="font-medium text-slate-800">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{player.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(player)}
                            className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Editar
                          </button>
                          <form action={deletePlayerAction}>
                            <input type="hidden" name="id" value={player.id} />
                            <input type="hidden" name="teamId" value={teamId} />
                            <button
                              type="submit"
                              className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              onClick={(e) => { if (!confirm(`Excluir "${player.name}"?`)) e.preventDefault() }}
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
