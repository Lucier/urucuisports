'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  upsertAdvertiserAction,
  deleteAdvertiserAction,
  type AdvertiserFormState,
} from '@/app/admin/anunciantes/actions'

type Advertiser = {
  id: string
  name: string
  logoUrl: string | null
  url: string
  createdAt: Date
}

const initialState: AdvertiserFormState = {}

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
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar anunciante'}
    </button>
  )
}

function AdvertiserLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
        {name.charAt(0).toUpperCase()}
      </div>
      {logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          className="absolute inset-0 h-full w-full rounded-lg border border-slate-100 object-contain bg-white p-0.5"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
    </div>
  )
}

export function AdvertiserManager({
  advertisers,
  totalCount,
}: {
  advertisers: Advertiser[]
  totalCount: number
}) {
  const [state, formAction] = useActionState(upsertAdvertiserAction, initialState)
  const [editing, setEditing] = useState<Advertiser | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  function startEdit(advertiser: Advertiser) {
    setEditing(advertiser)
    setLogoPreview(advertiser.logoUrl ?? '')
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
          {editing ? 'Editar anunciante' : 'Novo anunciante'}
        </h2>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome do anunciante <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ''}
              key={editing?.id ?? 'new-name'}
              className={inputCls}
              placeholder="Ex: Loja do Esporte"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL do site <span className="text-red-500">*</span>
            </label>
            <input
              name="url"
              required
              defaultValue={editing?.url ?? ''}
              key={editing?.id ?? 'new-url'}
              className={inputCls}
              placeholder="https://... ou www.site.com.br"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL do logo
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              {(logoPreview || editing?.logoUrl) && (
                <img
                  src={logoPreview || editing?.logoUrl || ''}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-100 object-contain bg-white p-0.5"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <input
                name="logoUrl"
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
      {totalCount > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Anunciantes cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Mobile: card list */}
            <ul className="divide-y divide-slate-50 sm:hidden">
              {advertisers.map((adv) => (
                <li key={adv.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AdvertiserLogo name={adv.name} logoUrl={adv.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{adv.name}</p>
                      <a
                        href={adv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs text-emerald-600 hover:underline"
                      >
                        {adv.url}
                      </a>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(adv)}
                      className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Editar
                    </button>
                    <form action={deleteAdvertiserAction}>
                      <input type="hidden" name="id" value={adv.id} />
                      <button
                        type="submit"
                        className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          if (!confirm(`Excluir "${adv.name}"?`)) e.preventDefault()
                        }}
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
                    <th className="px-4 py-3 text-left">Anunciante</th>
                    <th className="px-4 py-3 text-left">URL</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {advertisers.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AdvertiserLogo name={adv.name} logoUrl={adv.logoUrl} />
                          <span className="font-medium text-slate-800">{adv.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={adv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 truncate text-xs text-emerald-600 hover:underline"
                          style={{ maxWidth: 260 }}
                        >
                          <svg
                            className="h-3 w-3 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          <span className="truncate">{adv.url}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(adv)}
                            className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Editar
                          </button>
                          <form action={deleteAdvertiserAction}>
                            <input type="hidden" name="id" value={adv.id} />
                            <button
                              type="submit"
                              className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                if (!confirm(`Excluir "${adv.name}"?`)) e.preventDefault()
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
