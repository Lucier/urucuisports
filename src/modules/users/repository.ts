import { db } from '@/database/client'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'
import type { NewUser, UpdateUser } from './types'

export const usersRepository = {
  findAll: async () => {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(users.createdAt)
  },

  findById: async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user ?? null
  },

  findByEmail: async (email: string) => {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user ?? null
  },

  create: async (data: NewUser) => {
    const [user] = await db.insert(users).values(data).returning()
    return user!
  },

  update: async (id: string, data: UpdateUser) => {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return user ?? null
  },

  delete: async (id: string) => {
    await db.delete(users).where(eq(users.id, id))
  },
}
