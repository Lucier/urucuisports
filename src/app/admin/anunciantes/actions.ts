'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { advertisers } from '@/database/schema'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'

export type AdvertiserFormState = { error?: string; success?: string }

function normalizeUrl(val: unknown): string {
  const s = String(val ?? '').trim()
  if (s && !/^https?:\/\//i.test(s)) return `https://${s}`
  return s
}

const advertiserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(255),
  logoUrl: z.preprocess(normalizeUrl, z.string().url('URL do logo inválida.').or(z.literal(''))),
  url: z.preprocess(normalizeUrl, z.string().url('URL do site inválida.')),
})

function revalidate() {
  revalidatePath('/admin/anunciantes')
}

export async function upsertAdvertiserAction(
  _prev: AdvertiserFormState,
  formData: FormData,
): Promise<AdvertiserFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const parsed = advertiserSchema.safeParse({
    name: formData.get('name'),
    logoUrl: formData.get('logoUrl') || '',
    url: formData.get('url'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { name, logoUrl, url } = parsed.data
  const id = formData.get('id') as string | null

  try {
    if (id) {
      await db
        .update(advertisers)
        .set({ name, logoUrl: logoUrl || null, url })
        .where(eq(advertisers.id, id))
    } else {
      await db.insert(advertisers).values({ name, logoUrl: logoUrl || null, url })
    }
  } catch {
    return { error: 'Erro ao salvar o anunciante.' }
  }

  revalidate()
  return { success: id ? 'Anunciante atualizado.' : 'Anunciante cadastrado.' }
}

export async function deleteAdvertiserAction(formData: FormData): Promise<void> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return
  }
  const id = formData.get('id') as string | null
  if (!id) return
  await db.delete(advertisers).where(eq(advertisers.id, id))
  revalidate()
}
