import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database/client'
import { events } from '@/database/schema'

type Context = { params: Promise<{ id: string }> }

const idSchema = z.string().uuid()

/**
 * Serve o card do evento guardado no banco. É público (aparece na home). A URL leva
 * `?v=<updatedAt>`, então o cache longo é seguro: trocar o card muda a URL.
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [event] = await db
    .select({ cardImage: events.cardImage, cardMimeType: events.cardMimeType })
    .from(events)
    .where(eq(events.id, id))
    .limit(1)

  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new Response(new Uint8Array(event.cardImage), {
    headers: {
      'Content-Type': event.cardMimeType,
      'Content-Length': String(event.cardImage.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
