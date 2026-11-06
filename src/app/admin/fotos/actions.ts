'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { photoAlbums } from '@/database/schema'
import { SPORT_TYPES, type SportType } from '@/shared/constants'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'
import { parseBrasiliaDateTime } from '@/shared/utils'

export type AlbumFormState = { error?: string; success?: string }

const sportTypeValues = SPORT_TYPES.map((s) => s.value) as [SportType, ...SportType[]]

const albumSchema = z.object({
  title: z.string().min(2).max(255),
  url: z.string().url('URL inválida. Inclua https://'),
  description: z.string().max(500).optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  sportType: z.enum(sportTypeValues).optional(),
  // Vem de <input type="datetime-local"> (ex: 2026-11-05T14:30), sem fuso.
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Data do álbum inválida')
    .optional()
    .or(z.literal('')),
})

function revalidate() {
  revalidatePath('/fotos')
  revalidatePath('/admin/fotos')
}

export async function upsertAlbumAction(
  _prev: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const parsed = albumSchema.safeParse({
    title: formData.get('title'),
    url: formData.get('url'),
    description: formData.get('description') || undefined,
    coverUrl: formData.get('coverUrl') || '',
    sportType: formData.get('sportType') || undefined,
    publishedAt: formData.get('publishedAt') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { title, url, description, coverUrl, sportType, publishedAt } = parsed.data

  // Vazio = mantém a data atual (edição) ou usa "agora" (criação).
  const createdAt = publishedAt ? parseBrasiliaDateTime(publishedAt) : undefined
  if (publishedAt && !createdAt) return { error: 'Data do álbum inválida' }

  const id = formData.get('id') as string | null

  try {
    if (id) {
      await db
        .update(photoAlbums)
        .set({
          title,
          url,
          description: description ?? null,
          coverUrl: coverUrl || null,
          sportType: sportType ?? null,
          ...(createdAt && { createdAt }),
        })
        .where(eq(photoAlbums.id, id))
    } else {
      await db.insert(photoAlbums).values({
        title,
        url,
        description: description ?? null,
        coverUrl: coverUrl || null,
        sportType: sportType ?? null,
        ...(createdAt && { createdAt }),
      })
    }
  } catch {
    return { error: 'Erro ao salvar o álbum.' }
  }

  revalidate()
  return { success: id ? 'Álbum atualizado.' : 'Álbum criado com sucesso.' }
}

export async function deleteAlbumAction(formData: FormData): Promise<void> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return
  }
  const id = formData.get('id') as string | null
  if (!id) return
  await db.delete(photoAlbums).where(eq(photoAlbums.id, id))
  revalidate()
}
