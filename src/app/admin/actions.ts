'use server'

import { revalidatePath } from 'next/cache'
import { eq, isNull, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { posts, matches } from '@/database/schema'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostFormState = {
  error?: string
  success?: string
}

export type MatchFormState = {
  error?: string
  success?: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const postSchema = z.object({
  title: z.string().min(3).max(500),
  slug: z
    .string()
    .min(3)
    .max(500)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  content: z.string().min(10),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  relevancia: z.coerce.number().int().min(0).max(5),
})

const matchSchema = z.object({
  id: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99).nullable(),
  awayScore: z.coerce.number().int().min(0).max(99).nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']),
})

// ─── Revalidation helper ──────────────────────────────────────────────────────

function revalidateAll() {
  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath('/')
}

// ─── Post Actions ─────────────────────────────────────────────────────────────

export async function upsertPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const raw = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    categoryId: formData.get('categoryId'),
    imageUrl: formData.get('imageUrl') || '',
    relevancia: formData.get('relevancia') ?? '1',
  }

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(', ')
    return { error: msg }
  }

  const { title, slug, content, categoryId, imageUrl, relevancia } = parsed.data
  const id = formData.get('id') as string | null
  const currentUser = await requireRole(UserRole.ADMIN)

  try {
    if (id) {
      await db
        .update(posts)
        .set({ title, slug, content, categoryId, imageUrl: imageUrl || null, relevancia })
        .where(eq(posts.id, id))
    } else {
      await db.insert(posts).values({
        title,
        slug,
        content,
        categoryId,
        imageUrl: imageUrl || null,
        relevancia,
        authorId: currentUser.userId,
      })
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      return { error: 'Já existe uma notícia com esse slug.' }
    }
    return { error: 'Erro ao salvar a notícia.' }
  }

  revalidateAll()
  return { success: id ? 'Notícia atualizada com sucesso.' : 'Notícia criada com sucesso.' }
}

export async function deletePostAction(formData: FormData): Promise<void> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return
  }

  const id = formData.get('id') as string | null
  if (!id) return

  await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
  revalidateAll()
}

// ─── Match Action ─────────────────────────────────────────────────────────────

export async function updateMatchAction(
  _prev: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const homeScoreRaw = formData.get('homeScore')
  const awayScoreRaw = formData.get('awayScore')

  const raw = {
    id: formData.get('id'),
    homeScore: homeScoreRaw !== '' && homeScoreRaw !== null ? homeScoreRaw : null,
    awayScore: awayScoreRaw !== '' && awayScoreRaw !== null ? awayScoreRaw : null,
    status: formData.get('status'),
  }

  const parsed = matchSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(', ')
    return { error: msg }
  }

  const { id, homeScore, awayScore, status } = parsed.data

  try {
    await db
      .update(matches)
      .set({ homeScore, awayScore, status })
      .where(eq(matches.id, id))
  } catch {
    return { error: 'Erro ao atualizar a partida.' }
  }

  revalidatePath('/admin/noticias')
  revalidatePath('/')
  revalidatePath('/estatisticas')
  return { success: 'Partida atualizada.' }
}
