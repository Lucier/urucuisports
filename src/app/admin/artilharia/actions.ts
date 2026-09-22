'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { artilharia } from '@/database/schema'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/shared/types/auth'

export type ArtilhariaFormState = { error?: string; success?: string }

const artilhariaSchema = z.object({
  nomeJogador: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(255),
  leagueId: z.string().uuid('Liga inválida.'),
  teamId: z.string().uuid('Time inválido.'),
  fotoUrl: z.string().url('URL da foto inválida.').optional().or(z.literal('')),
  gols: z.coerce.number().int().min(0, 'Gols não pode ser negativo.'),
})

function revalidate() {
  revalidatePath('/admin/artilharia')
}

export async function upsertArtilhariaAction(
  _prev: ArtilhariaFormState,
  formData: FormData,
): Promise<ArtilhariaFormState> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return { error: 'Acesso negado.' }
  }

  const parsed = artilhariaSchema.safeParse({
    nomeJogador: formData.get('nomeJogador'),
    leagueId: formData.get('leagueId'),
    teamId: formData.get('teamId'),
    fotoUrl: formData.get('fotoUrl') || '',
    gols: formData.get('gols'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { nomeJogador, leagueId, teamId, fotoUrl, gols } = parsed.data
  const id = formData.get('id') as string | null

  try {
    if (id) {
      await db
        .update(artilharia)
        .set({ nomeJogador, leagueId, teamId, fotoUrl: fotoUrl || null, gols })
        .where(eq(artilharia.id, id))
    } else {
      await db.insert(artilharia).values({ nomeJogador, leagueId, teamId, fotoUrl: fotoUrl || null, gols })
    }
  } catch {
    return { error: 'Erro ao salvar o artilheiro.' }
  }

  revalidate()
  return { success: id ? 'Artilheiro atualizado.' : 'Artilheiro cadastrado.' }
}

export async function deleteArtilhariaAction(formData: FormData): Promise<void> {
  try {
    await requireRole(UserRole.ADMIN)
  } catch {
    return
  }
  const id = formData.get('id') as string | null
  if (!id) return
  await db.delete(artilharia).where(eq(artilharia.id, id))
  revalidate()
}
