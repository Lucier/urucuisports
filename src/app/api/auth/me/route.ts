import { NextRequest, NextResponse } from 'next/server'
import { usersRepository } from '@/modules/users/repository'
import { withAuth } from '@/lib/auth'
import type { JWTPayload } from '@/shared/types/auth'

export const GET = withAuth(async (_req: NextRequest, session: JWTPayload) => {
  const user = await usersRepository.findById(session.userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  })
})
