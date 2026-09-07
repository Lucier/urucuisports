'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { upsertAlbumAction, deleteAlbumAction, type AlbumFormState } from '@/app/admin/fotos/actions'
import { formatDate } from '@/shared/utils'

type Album = {
  id: string
  title: string
  description: string | null
  url: string
  coverUrl: string | null
  createdAt: Date
}

const initialState: AlbumFormState = {}

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
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar álbum'}
    </button>
  )
}

export function PhotoAlbumManager({ albums, totalCount }: { albums: Album[]; totalCount: number }) {
  const [state, formAction, pending] = useActionState(upsertAlbumAction, initialState)
  const [editing, setEditing] = useState<Album | null>(null)

  function startEdit(album: Album) {
    setEditing(album)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
  }

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar álbum' : 'Novo álbum'}
        </h2>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={editing?.title ?? ''}
              key={editing?.id ?? 'new-title'}
              className={inputCls}
              placeholder="Ex: Brasileirão 2026 — Rodada 12"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Link do repositório <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-gray-400">
                (Google Drive, Flickr, OneDrive, etc.)
              </span>
            </label>
            <input
              name="url"
              type="url"
              required
              defaultValue={editing?.url ?? ''}
              key={editing?.id ?? 'new-url'}
              className={inputCls}
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ''}
              key={editing?.id ?? 'new-desc'}
              className={`${inputCls} resize-none`}
              placeholder="Descrição opcional..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL da imagem de capa
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              name="coverUrl"
              type="url"
              defaultValue={editing?.coverUrl ?? ''}
              key={editing?.id ?? 'new-cover'}
              className={inputCls}
              placeholder="https://..."
            />
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
      {albums.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Álbuns cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Álbum</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Link</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {albums.map((album) => (
                  <tr key={album.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-700 to-slate-900">
                          {album.coverUrl && (
                            <Image
                              src={album.coverUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{album.title}</p>
                          {album.description && (
                            <p className="truncate text-xs text-gray-400">{album.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <a
                        href={album.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 truncate text-xs text-emerald-600 hover:underline"
                        style={{ maxWidth: 220 }}
                      >
                        <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">{album.url}</span>
                      </a>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-400 md:table-cell">
                      {formatDate(album.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(album)}
                          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </button>
                        <form action={deleteAlbumAction}>
                          <input type="hidden" name="id" value={album.id} />
                          <button
                            type="submit"
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              if (!confirm('Excluir este álbum?')) e.preventDefault()
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
