import { NextResponse } from 'next/server'
import { db } from '@/database/client'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'ok',
    })
  } catch (err) {
    console.error('[health] Database check failed:', err)
    return NextResponse.json(
      { status: 'degraded', timestamp: new Date().toISOString(), database: 'error' },
      { status: 503 },
    )
  }
}
