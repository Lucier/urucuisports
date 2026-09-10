'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { upsertUserAction, deleteUserAction, type UserFormState } from '@/app/admin/usuarios/actions'

type UserRow = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
}

const initialState: UserFormState = {}

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
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar usuário'}
    </button>
  )
}

export function UserManager({ users, totalCount }: { users: UserRow[]; totalCount: number }) {
  const [state, formAction] = useActionState(upsertUserAction, initialState)
  const [editing, setEditing] = useState<UserRow | null>(null)

  useEffect(() => {
    if (state.success) {
      setEditing(null)
    }
  }, [state])

  function startEdit(user: UserRow) {
    setEditing(user)
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
          {editing ? 'Editar usuário' : 'Novo usuário'}
        </h2>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ''}
                key={(editing?.id ?? 'new') + '-name'}
                className={inputCls}
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={editing?.email ?? ''}
                key={(editing?.id ?? 'new') + '-email'}
                className={inputCls}
                placeholder="usuario@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Senha {editing ? <span className="text-xs font-normal text-slate-400">(deixe em branco para manter)</span> : <span className="text-red-500">*</span>}
              </label>
              <input
                name="password"
                type="password"
                key={(editing?.id ?? 'new') + '-password'}
                className={inputCls}
                placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Perfil <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                defaultValue={editing?.role ?? 'USER'}
                key={(editing?.id ?? 'new') + '-role'}
                className={inputCls}
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
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
            Usuários cadastrados
            <span className="ml-2 text-base font-normal text-gray-400">({totalCount})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Perfil</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Desde</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </button>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              if (!confirm(`Excluir "${user.name}"?`)) e.preventDefault()
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
