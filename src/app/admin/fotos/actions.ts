'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { photoAlbums } from '@/database/schema'
import { SPORT_TYPES, type SportType } from '@/shared/constants'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'

export type AlbumFormState = { error?: string; success?: string }

const sportTypeValues = SPORT_TYPES.map((s) => s.value) as [SportType, ...SportType[]]

const albumSchema = z.object({
  title: z.string().min(2).max(255),
  url: z.string().url('URL inválida. Inclua https://'),
  description: z.string().max(500).optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  sportType: z.enum(sportTypeValues).optional(),
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
  })

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { title, url, description, coverUrl, sportType } = parsed.data
  const id = formData.get('id') as string | null

  try {
    if (id) {
      await db
        .update(photoAlbums)
        .set({ title, url, description: description ?? null, coverUrl: coverUrl || null, sportType: sportType ?? null })
        .where(eq(photoAlbums.id, id))
    } else {
      await db.insert(photoAlbums).values({
        title,
        url,
        description: description ?? null,
        coverUrl: coverUrl || null,
        sportType: sportType ?? null,
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
