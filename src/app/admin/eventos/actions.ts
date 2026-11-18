'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { events } from '@/database/schema'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'
import { eventSchema } from '@/modules/events/schema'
import { validateCardImage } from '@/modules/events/card'

export type EventFormState = { error?: string; success?: string }

const idSchema = z.string().uuid()

function revalidate() {
  revalidatePath('/admin/eventos')
  revalidatePath('/')
}

export async function upsertEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const parsed = eventSchema.safeParse({
    name: formData.get('name') ?? '',
    startsAt: formData.get('startsAt') ?? '',
    whatsapp: formData.get('whatsapp') ?? '',
    siteUrl: formData.get('siteUrl') ?? '',
    instagram: formData.get('instagram') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(' ') }
  }
  const { name, startsAt, whatsapp, siteUrl, instagram } = parsed.data

  const rawId = formData.get('id')
  const id = typeof rawId === 'string' && rawId ? rawId : null
  if (id && !idSchema.safeParse(id).success) {
    return { error: 'Evento inválido.' }
  }

  // O campo de arquivo vazio chega como um File de 0 bytes (ou ausente).
  const cardField = formData.get('card')
  const cardFile = cardField instanceof File && cardField.size > 0 ? cardField : null

  if (!id && !cardFile) {
    return { error: 'Envie o card do evento (JPG, JPEG ou PNG).' }
  }

  let card: { buffer: Buffer; mimeType: string } | null = null
  if (cardFile) {
    const validation = await validateCardImage(cardFile)
    if (!validation.ok) return { error: validation.error }
    card = validation
  }

  const values = {
    name,
    startsAt,
    whatsapp: whatsapp || null,
    siteUrl: siteUrl || null,
    instagram: instagram || null,
  }

  try {
    if (id) {
      // Sem novo arquivo, o card atual é mantido.
      const updated = await db
        .update(events)
        .set({
          ...values,
          ...(card ? { cardImage: card.buffer, cardMimeType: card.mimeType } : {}),
          updatedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning({ id: events.id })

      if (updated.length === 0) return { error: 'Evento não encontrado.' }
    } else if (card) {
      await db.insert(events).values({
        ...values,
        cardImage: card.buffer,
        cardMimeType: card.mimeType,
      })
    }
  } catch {
    return { error: 'Erro ao salvar o evento.' }
  }

  revalidate()
  return { success: id ? 'Evento atualizado.' : 'Evento cadastrado.' }
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return
  }
  const id = formData.get('id')
  if (typeof id !== 'string' || !idSchema.safeParse(id).success) return

  await db.delete(events).where(eq(events.id, id))
  revalidate()
}
