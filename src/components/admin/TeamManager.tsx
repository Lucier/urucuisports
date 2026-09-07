'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { upsertTeamAction, deleteTeamAction, type TeamFormState } from '@/app/admin/times/actions'

type Team = {
  id: string
  name: string
  logoUrl: string | null
}

const initialState: TeamFormState = {}

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
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar time'}
    </button>
  )
}

function TeamAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
        {name.charAt(0).toUpperCase()}
      </div>
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="40px"
          className="rounded-full object-contain bg-slate-50 border border-slate-100"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

export function TeamManager({ teams, totalCount }: { teams: Team[]; totalCount: number }) {
  const [state, formAction] = useActionState(upsertTeamAction, initialState)
  const [editing, setEditing] = useState<Team | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  function startEdit(team: Team) {
    setEditing(team)
    setLogoPreview(team.logoUrl ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
    setLogoPreview('')
  }

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar time' : 'Novo time'}
        </h2>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

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
              placeholder="Ex: Flamengo"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL do brasão
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              {(logoPreview || editing?.logoUrl) && (
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src={logoPreview || editing?.logoUrl || ''}
                    alt=""
                    fill
                    sizes="40px"
                    className="rounded-full border border-slate-100 object-contain bg-slate-50"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                  />
                </div>
              )}
              <input
                name="logoUrl"
                type="url"
                defaultValue={editing?.logoUrl ?? ''}
                key={editing?.id ?? 'new-logo'}
                className={inputCls}
                placeholder="https://..."
                onChange={(e) => setLogoPreview(e.target.value)}
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
      {teams.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Times cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeamAvatar name={team.name} logoUrl={team.logoUrl} />
                        <span className="font-medium text-slate-800">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(team)}
                          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </button>
                        <form action={deleteTeamAction}>
                          <input type="hidden" name="id" value={team.id} />
                          <button
                            type="submit"
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              if (!confirm(`Excluir "${team.name}"?`)) e.preventDefault()
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
      )}
    </div>
  )
}
