'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  upsertStreamAction,
  deleteStreamAction,
  updateStreamStatusAction,
  type StreamFormState,
} from '@/app/admin/transmissoes/actions'
import { toThumbnailUrl } from '@/lib/youtube'
import { cn } from '@/shared/utils'

type Stream = {
  id: string
  title: string
  description: string | null
  url: string
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED'
  scheduledAt: Date | null
  createdAt: Date
}

const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Ao vivo',
  SCHEDULED: 'Agendado',
  FINISHED: 'Encerrado',
}

const STATUS_COLORS: Record<string, string> = {
  LIVE: 'bg-red-100 text-red-700',
  SCHEDULED: 'bg-sky-100 text-sky-700',
  FINISHED: 'bg-slate-100 text-slate-500',
}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const initialState: StreamFormState = {}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar transmissão'}
    </button>
  )
}

export function StreamManager({ streams, totalCount }: { streams: Stream[]; totalCount: number }) {
  const [state, formAction] = useActionState(upsertStreamAction, initialState)
  const [editing, setEditing] = useState<Stream | null>(null)

  function startEdit(stream: Stream) {
    setEditing(stream)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
  }

  function toDatetimeLocal(date: Date | null): string {
    if (!date) return ''
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar transmissão' : 'Nova transmissão'}
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
              placeholder="Ex: Flamengo x Palmeiras — Brasileirão 2026"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL do YouTube <span className="text-red-500">*</span>
            </label>
            <input
              name="url"
              type="url"
              required
              defaultValue={editing?.url ?? ''}
              key={editing?.id ?? 'new-url'}
              className={inputCls}
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
            />
            <p className="mt-1 text-xs text-gray-400">
              Formatos aceitos: youtube.com/watch, youtube.com/live, youtu.be
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ''}
              key={editing?.id ?? 'new-desc'}
              className={`${inputCls} resize-none`}
              placeholder="Informações adicionais sobre a partida..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                defaultValue={editing?.status ?? 'SCHEDULED'}
                key={editing?.id ?? 'new-status'}
                className={inputCls}
              >
                <option value="SCHEDULED">Agendado</option>
                <option value="LIVE">Ao vivo</option>
                <option value="FINISHED">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data e horário
                <span className="ml-1 text-xs font-normal text-gray-400">(se agendado)</span>
              </label>
              <input
                name="scheduledAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(editing?.scheduledAt ?? null)}
                key={editing?.id ?? 'new-date'}
                className={inputCls}
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
      {streams.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Transmissões cadastradas
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="space-y-3">
            {streams.map((stream) => {
              const thumb = toThumbnailUrl(stream.url)
              return (
                <div
                  key={stream.id}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm',
                    stream.status === 'LIVE' ? 'border-red-200' : 'border-slate-100',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[stream.status])}>
                        {STATUS_LABELS[stream.status]}
                      </span>
                      {stream.scheduledAt && (
                        <span className="text-xs text-gray-400">
                          {new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          }).format(new Date(stream.scheduledAt))}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate font-semibold text-slate-800">{stream.title}</p>
                  </div>

                  {/* Ações rápidas de status */}
                  <div className="hidden flex-shrink-0 items-center gap-1 sm:flex">
                    {(['LIVE', 'SCHEDULED', 'FINISHED'] as const).map((s) => (
                      stream.status !== s && (
                        <form key={s} action={updateStreamStatusAction}>
                          <input type="hidden" name="id" value={stream.id} />
                          <input type="hidden" name="status" value={s} />
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-slate-100"
                          >
                            → {STATUS_LABELS[s]}
                          </button>
                        </form>
                      )
                    ))}
                  </div>

                  {/* Editar / Excluir */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(stream)}
                      className="rounded px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Editar
                    </button>
                    <form action={deleteStreamAction}>
                      <input type="hidden" name="id" value={stream.id} />
                      <button
                        type="submit"
                        className="rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={(e) => { if (!confirm('Excluir esta transmissão?')) e.preventDefault() }}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
