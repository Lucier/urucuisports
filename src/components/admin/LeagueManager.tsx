'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { upsertLeagueAction, deleteLeagueAction, type LeagueFormState } from '@/app/admin/ligas/actions'

type LeagueTipo = 'pontos_corridos' | 'grupos'

type League = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  tipo: LeagueTipo
  numeroGrupos: number | null
  teamCount: number
}

const initialState: LeagueFormState = {}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const selectCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white'

const GRUPO_OPTIONS = [2, 3, 4, 6, 8, 10, 12, 16]

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar liga'}
    </button>
  )
}

function LeagueBadge({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-emerald-100 text-lg font-bold text-emerald-700">
        🏆
      </div>
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="40px"
          className="rounded-lg border border-slate-100 object-contain bg-slate-50 p-0.5"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

function TipoBadge({ tipo, numeroGrupos }: { tipo: LeagueTipo; numeroGrupos: number | null }) {
  if (tipo === 'grupos') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
        Grupos{numeroGrupos ? ` · ${numeroGrupos}` : ''}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      Pts corridos
    </span>
  )
}

export function LeagueManager({ leagues, totalCount }: { leagues: League[]; totalCount: number }) {
  const [state, formAction] = useActionState(upsertLeagueAction, initialState)
  const [editing, setEditing] = useState<League | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [tipo, setTipo] = useState<LeagueTipo | ''>('')
  const [formKey, setFormKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<League | null>(null)

  useEffect(() => {
    if (state.success) {
      setEditing(null)
      setLogoPreview('')
      setTipo('')
      setFormKey((k) => k + 1)
    }
  }, [state.success])

  function startEdit(league: League) {
    setEditing(league)
    setLogoPreview(league.logoUrl ?? '')
    setTipo(league.tipo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
    setLogoPreview('')
    setTipo('')
  }

  return (
    <div className="space-y-10">
      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-800">Excluir liga?</h2>
            <p className="mt-1 text-sm text-slate-500">
              A liga <span className="font-medium text-slate-700">&ldquo;{deleteTarget.name}&rdquo;</span> será removida permanentemente. Os times vinculados não serão excluídos.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <form action={deleteLeagueAction} onSubmit={() => setDeleteTarget(null)}>
                <input type="hidden" name="id" value={deleteTarget.id} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Confirmar exclusão
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar liga' : 'Nova liga'}
        </h2>

        <form key={formKey} action={formAction} className="space-y-4">
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
              placeholder="Ex: Campeonato Piauiense"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL do logo
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
                    className="rounded-lg border border-slate-100 object-contain bg-slate-50 p-0.5"
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

          {/* Tipo */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as LeagueTipo | '')}
              className={selectCls}
            >
              <option value="" disabled>Escolha o tipo de liga</option>
              <option value="pontos_corridos">Pontos corridos</option>
              <option value="grupos">Grupos</option>
            </select>
          </div>

          {/* Número de grupos — visível só quando tipo = grupos */}
          {tipo === 'grupos' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Número de grupos <span className="text-red-500">*</span>
              </label>
              <select
                name="numeroGrupos"
                defaultValue={editing?.numeroGrupos ?? GRUPO_OPTIONS[0]}
                key={editing?.id ?? 'new-grupos'}
                className={selectCls}
              >
                {GRUPO_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} grupo{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

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
      {leagues.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Ligas cadastradas
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Liga</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Tipo</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Times</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leagues.map((league) => (
                  <tr key={league.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <LeagueBadge name={league.name} logoUrl={league.logoUrl} />
                        <div>
                          <p className="font-medium text-slate-800">{league.name}</p>
                          <p className="text-xs text-slate-400">/{league.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <TipoBadge tipo={league.tipo} numeroGrupos={league.numeroGrupos} />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {league.teamCount} {league.teamCount === 1 ? 'time' : 'times'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/ligas?liga=${league.id}`}
                          className="rounded px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50"
                        >
                          Times
                        </a>
                        <button
                          type="button"
                          onClick={() => startEdit(league)}
                          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(league)}
                          className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
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
