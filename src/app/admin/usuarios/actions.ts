'use server'

import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import { db } from '@/database/client'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'

export type UserFormState = { error?: string; success?: string }

export async function upsertUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const id       = formData.get('id') as string | null
  const name     = (formData.get('name') as string).trim()
  const email    = (formData.get('email') as string).trim().toLowerCase()
  const password = (formData.get('password') as string).trim()
  const role     = formData.get('role') as 'ADMIN' | 'USER'

  if (!name || !email || !role) return { error: 'Preencha todos os campos obrigatórios.' }
  if (!id && !password) return { error: 'Senha obrigatória ao criar usuário.' }
  if (password && password.length < 6) return { error: 'A senha deve ter no mínimo 6 caracteres.' }

  try {
    if (id) {
      const data: Record<string, unknown> = { name, email, role, updatedAt: new Date() }
      if (password) data.password = await hash(password, 10)
      await db.update(users).set(data).where(eq(users.id, id))
      revalidatePath('/admin/usuarios')
      return { success: 'Usuário atualizado com sucesso.' }
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
    if (existing.length > 0) return { error: 'Já existe um usuário com este e-mail.' }

    const hashed = await hash(password, 10)
    await db.insert(users).values({ name, email, password: hashed, role })
    revalidatePath('/admin/usuarios')
    return { success: 'Usuário criado com sucesso.' }
  } catch {
    return { error: 'Erro ao salvar usuário. Tente novamente.' }
  }
}

export async function deleteUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'ID inválido.' }
  try {
    await db.delete(users).where(eq(users.id, id))
    revalidatePath('/admin/usuarios')
    return { success: 'Usuário removido.' }
  } catch {
    return { error: 'Erro ao remover usuário.' }
  }
}
