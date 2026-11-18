import { z } from 'zod'
import { parseBrasiliaDateTime } from '@/shared/utils'

/**
 * WhatsApp: aceita "(89) 99999-9999", "+55 89 99999-9999" etc. e devolve só dígitos com DDI.
 * Retorna null se não for um número brasileiro plausível (DDD + 8 ou 9 dígitos).
 */
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const full = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits

  if (!/^55\d{10,11}$/.test(full)) return null
  // O DDD não começa com 0
  if (full[2] === '0') return null
  return full
}

/**
 * Instagram: aceita "@perfil", "perfil" ou um link do instagram.com e devolve só o handle.
 * Retorna null se o handle for inválido.
 */
export function normalizeInstagram(raw: string): string | null {
  let value = raw.trim()

  const fromUrl = value.match(/instagram\.com\/([^/?#\s]+)/i)
  if (fromUrl) value = fromUrl[1]

  value = value.replace(/^@/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(value) ? value : null
}

/**
 * Site: prefixa https:// quando o protocolo foi omitido. Só aceita http(s) com um domínio.
 * Retorna null se a URL for inválida.
 */
export function normalizeSiteUrl(raw: string): string | null {
  const value = raw.trim()
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return withProtocol
  } catch {
    return null
  }
}

/** Campo de texto opcional: vazio vira '', preenchido passa pelo normalizador. */
function optionalField(normalize: (value: string) => string | null, message: string) {
  return z
    .string()
    .trim()
    .default('')
    .transform((value, ctx) => {
      if (!value) return ''
      const normalized = normalize(value)
      if (normalized === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message })
        return z.NEVER
      }
      return normalized
    })
}

export const eventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter ao menos 2 caracteres.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  startsAt: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const date = parseBrasiliaDateTime(value)
      if (!date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data e hora do evento inválidas.' })
        return z.NEVER
      }
      return date
    }),
  whatsapp: optionalField(
    normalizeWhatsapp,
    'WhatsApp inválido. Informe o DDD e o número, ex.: (89) 99999-9999.',
  ),
  siteUrl: optionalField(normalizeSiteUrl, 'URL do site inválida.'),
  instagram: optionalField(
    normalizeInstagram,
    'Instagram inválido. Informe o @perfil ou o link do perfil.',
  ),
})

export type EventInput = z.output<typeof eventSchema>
