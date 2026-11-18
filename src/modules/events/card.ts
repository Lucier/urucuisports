/** Tamanho máximo do card do evento (a imagem fica no banco, então o limite é baixo). */
export const MAX_CARD_BYTES = 2 * 1024 * 1024

export const CARD_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'

export type CardMimeType = 'image/jpeg' | 'image/png'

/**
 * Identifica o formato pelos primeiros bytes do arquivo. Não confiamos na extensão nem
 * no Content-Type enviados pelo navegador: só o conteúdo diz o que o arquivo realmente é.
 */
export function detectCardMimeType(bytes: Uint8Array): CardMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length >= 8 && pngSignature.every((byte, i) => bytes[i] === byte)) {
    return 'image/png'
  }
  return null
}

export type CardValidation =
  | { ok: true; buffer: Buffer; mimeType: CardMimeType }
  | { ok: false; error: string }

export async function validateCardImage(file: File): Promise<CardValidation> {
  if (file.size === 0) {
    return { ok: false, error: 'O arquivo do card está vazio.' }
  }
  if (file.size > MAX_CARD_BYTES) {
    return { ok: false, error: 'O card deve ter no máximo 2 MB.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = detectCardMimeType(buffer)
  if (!mimeType) {
    return { ok: false, error: 'O card deve ser uma imagem JPG, JPEG ou PNG.' }
  }

  return { ok: true, buffer, mimeType }
}

/** URL pública do card. O `v` muda quando o card é trocado, o que invalida o cache. */
export function eventCardUrl(event: { id: string; updatedAt: Date | string }): string {
  return `/api/eventos/${event.id}/card?v=${new Date(event.updatedAt).getTime()}`
}
