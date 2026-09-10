'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { upsertPostAction, deletePostAction, type PostFormState } from '@/app/admin/actions'

type Category = { id: string; name: string }

type Post = {
  id: string
  title: string
  slug: string
  content: string
  imageUrl: string | null
  categoryId: string | null
  categoryName: string | null
  relevancia: number
  createdAt: Date
}

interface Props {
  categories: Category[]
  initialPosts: Post[]
  adminId: string
}

const initialState: PostFormState = {}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : editing ? 'Atualizar notícia' : 'Publicar notícia'}
    </button>
  )
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function PostFormSection({ categories, initialPosts, adminId }: Props) {
  const [state, formAction] = useActionState(upsertPostAction, initialState)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (state.success) {
      setEditingPost(null)
      setTitle('')
      setSlug('')
      setSlugManual(false)
    }
  }, [state])

  function startEdit(post: Post) {
    setEditingPost(post)
    setTitle(post.title)
    setSlug(post.slug)
    setSlugManual(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingPost(null)
    setTitle('')
    setSlug('')
    setSlugManual(false)
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
    if (!slugManual) setSlug(slugify(e.target.value))
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-slate-800">
        {editingPost ? 'Editar notícia' : 'Nova notícia'}
      </h2>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <form action={formAction} className="space-y-4">
          {editingPost && <input type="hidden" name="id" value={editingPost.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
              <input
                name="title"
                required
                value={title}
                onChange={handleTitleChange}
                className={inputCls}
                placeholder="Ex: Flamengo vence clássico..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
              <input
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugManual(true)
                }}
                className={`${inputCls} font-mono`}
                placeholder="flamengo-vence-classico"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
              <select
                name="categoryId"
                required
                defaultValue={editingPost?.categoryId ?? ''}
                key={editingPost?.id ?? 'new'}
                className={inputCls}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                URL da imagem
              </label>
              <input
                name="imageUrl"
                type="url"
                defaultValue={editingPost?.imageUrl ?? ''}
                key={editingPost?.id ?? 'new'}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Relevância no carrocel
              </label>
              <select
                name="relevancia"
                required
                defaultValue={editingPost?.relevancia ?? 1}
                key={(editingPost?.id ?? 'new') + '-rel'}
                className={inputCls}
              >
                <option value={1}>1 — Mais relevante</option>
                <option value={2}>2 — Alta</option>
                <option value={3}>3 — Média</option>
                <option value={4}>4 — Baixa</option>
                <option value={5}>5 — Menos relevante</option>
                <option value={0}>0 — Fora do carrocel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Conteúdo</label>
            <textarea
              name="content"
              required
              rows={6}
              defaultValue={editingPost?.content ?? ''}
              key={editingPost?.id ?? 'new'}
              className={`${inputCls} resize-y`}
              placeholder="Texto da notícia..."
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

          <div className="flex gap-3">
            <SubmitButton editing={!!editingPost} />
            {editingPost && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Post list */}
      {initialPosts.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Mobile: card list */}
          <ul className="divide-y divide-slate-50 sm:hidden">
            {initialPosts.map((post) => (
              <li key={post.id} className="px-4 py-3">
                <p className="font-medium text-slate-800 leading-snug">{post.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {post.categoryName ?? '—'} · {new Date(post.createdAt).toLocaleDateString('pt-BR')} · Relevância:{' '}
                  {post.relevancia === 0 ? 'Fora do carrocel' : post.relevancia}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Editar
                  </button>
                  <form action={deletePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      onClick={(e) => { if (!confirm('Excluir esta notícia?')) e.preventDefault() }}
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
                  <th className="px-4 py-3 text-left">Título</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-center">Relevância</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{post.title}</td>
                    <td className="px-4 py-3 text-slate-500">{post.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {post.relevancia === 0 ? (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Fora
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {post.relevancia}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="rounded px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </button>
                        <form action={deletePostAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <button
                            type="submit"
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            onClick={(e) => { if (!confirm('Excluir esta notícia?')) e.preventDefault() }}
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
    </section>
  )
}
