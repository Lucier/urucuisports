'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import {
  upsertEventAction,
  deleteEventAction,
  type EventFormState,
} from '@/app/admin/eventos/actions'
import { formatDateTime, toDateTimeLocalValue } from '@/shared/utils'
import { CARD_ACCEPT, MAX_CARD_BYTES, eventCardUrl } from '@/modules/events/card'

type SportsEvent = {
  id: string
  name: string
  startsAt: Date
  whatsapp: string | null
  siteUrl: string | null
  instagram: string | null
  updatedAt: Date
}

const initialState: EventFormState = {}

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
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar evento'}
    </button>
  )
}

function EventThumb({ event }: { event: SportsEvent }) {
  return (
    // Rota de imagem dinâmica: sem otimização do next/image.
    <Image
      src={eventCardUrl(event)}
      alt={`Card do evento ${event.name}`}
      width={96}
      height={64}
      unoptimized
      className="h-12 w-20 flex-shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
    />
  )
}

function EventActions({ event, onEdit }: { event: SportsEvent; onEdit: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
      >
        Editar
      </button>
      <form action={deleteEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <button
          type="submit"
          className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          onClick={(e) => {
            if (!confirm(`Excluir "${event.name}"?`)) e.preventDefault()
          }}
        >
          Excluir
        </button>
      </form>
    </>
  )
}

function EndedBadge({ startsAt }: { startsAt: Date }) {
  if (new Date(startsAt).getTime() >= Date.now()) return null
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
      Encerrado
    </span>
  )
}

export function EventManager({
  events,
  totalCount,
}: {
  events: SportsEvent[]
  totalCount: number
}) {
  const [state, formAction] = useActionState(upsertEventAction, initialState)
  const [editing, setEditing] = useState<SportsEvent | null>(null)
  const [filePreview, setFilePreview] = useState<string>('')
  const [fileError, setFileError] = useState<string>('')
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) {
      setEditing(null)
      setFilePreview('')
      setFileError('')
      formRef.current?.reset()
    }
  }, [state])

  function startEdit(event: SportsEvent) {
    setEditing(event)
    setFilePreview('')
    setFileError('')
    if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(null)
    setFilePreview('')
    setFileError('')
    formRef.current?.reset()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileError('')
    if (!file) {
      setFilePreview('')
      return
    }
    // Checagem rápida no navegador; a validação de verdade (bytes do arquivo) é no servidor.
    if (file.size > MAX_CARD_BYTES) {
      setFileError('O card deve ter no máximo 2 MB.')
      e.target.value = ''
      setFilePreview('')
      return
    }
    // data: URL (e não blob:) porque a CSP do site só libera 'self', data: e https: em img-src.
    const reader = new FileReader()
    reader.onload = () => setFilePreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  const currentCard = filePreview || (editing ? eventCardUrl(editing) : '')

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-800">
          {editing ? 'Editar evento' : 'Novo evento'}
        </h2>

        <form ref={formRef} action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome do evento <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                maxLength={255}
                defaultValue={editing?.name ?? ''}
                key={editing?.id ?? 'new-name'}
                className={inputCls}
                placeholder="Ex: Copa Urucuí de Futsal"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data e hora <span className="text-red-500">*</span>
              </label>
              <input
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={editing ? toDateTimeLocalValue(editing.startsAt) : ''}
                key={editing?.id ?? 'new-starts'}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-400">Horário de Brasília.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Card do evento <span className="text-red-500">{editing ? '' : '*'}</span>
              <span className="ml-1 text-xs font-normal text-gray-400">
                (JPG, JPEG ou PNG, até 2 MB
                {editing ? '; deixe vazio para manter o atual' : ''})
              </span>
            </label>
            <div className="flex items-start gap-3">
              {currentCard && (
                <Image
                  src={currentCard}
                  alt="Pré-visualização do card"
                  width={192}
                  height={128}
                  unoptimized
                  className="h-20 w-32 flex-shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
                />
              )}
              <input
                ref={fileRef}
                name="card"
                type="file"
                accept={CARD_ACCEPT}
                onChange={onFileChange}
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                WhatsApp
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                name="whatsapp"
                inputMode="tel"
                defaultValue={editing?.whatsapp ?? ''}
                key={editing?.id ?? 'new-whatsapp'}
                className={inputCls}
                placeholder="(89) 99999-9999"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                URL do site
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                name="siteUrl"
                defaultValue={editing?.siteUrl ?? ''}
                key={editing?.id ?? 'new-site'}
                className={inputCls}
                placeholder="https://... ou www.site.com.br"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Instagram
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                name="instagram"
                defaultValue={editing?.instagram ?? ''}
                key={editing?.id ?? 'new-instagram'}
                className={inputCls}
                placeholder="@perfil"
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
            Eventos cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Mobile: card list */}
            <ul className="divide-y divide-slate-50 sm:hidden">
              {events.map((event) => (
                <li key={event.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <EventThumb event={event} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{event.name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(event.startsAt)}</p>
                      <EndedBadge startsAt={event.startsAt} />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <EventActions event={event} onEdit={() => startEdit(event)} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Evento</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Contatos</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <EventThumb event={event} />
                          <span className="font-medium text-slate-800">{event.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        <div>{formatDateTime(event.startsAt)}</div>
                        <EndedBadge startsAt={event.startsAt} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <div className="flex flex-col gap-0.5">
                          <span>{event.whatsapp ? `WhatsApp: +${event.whatsapp}` : ''}</span>
                          <span className="max-w-[220px] truncate">
                            {event.siteUrl ? `Site: ${event.siteUrl}` : ''}
                          </span>
                          <span>{event.instagram ? `Instagram: @${event.instagram}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <EventActions event={event} onEdit={() => startEdit(event)} />
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
