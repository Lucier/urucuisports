import { NextRequest, NextResponse } from 'next/server'

// 64 KB is enough for any JSON auth payload; rejects oversized requests early
const DEFAULT_MAX_BYTES = 64 * 1024

export function checkBodySize(req: NextRequest, maxBytes = DEFAULT_MAX_BYTES): NextResponse | null {
  const cl = req.headers.get('content-length')
  if (cl !== null && parseInt(cl, 10) > maxBytes) {
    return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 })
  }
  return null
}
