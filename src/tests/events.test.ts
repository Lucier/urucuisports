import { describe, it, expect } from 'vitest'
import {
  eventSchema,
  normalizeInstagram,
  normalizeSiteUrl,
  normalizeWhatsapp,
} from '@/modules/events/schema'
import {
  MAX_CARD_BYTES,
  detectCardMimeType,
  eventCardUrl,
  validateCardImage,
} from '@/modules/events/card'
import { startOfTodayBrasilia } from '@/shared/utils'

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]

function makeFile(bytes: number[], name: string, type: string, size?: number): File {
  const data = new Uint8Array(size ?? bytes.length)
  data.set(bytes)
  return new File([data], name, { type })
}

describe('normalizeWhatsapp', () => {
  it('adiciona o DDI 55 quando só vêm DDD e número', () => {
    expect(normalizeWhatsapp('(89) 99999-9999')).toBe('5589999999999')
    expect(normalizeWhatsapp('89 3333-4444')).toBe('558933334444')
  })

  it('mantém o número que já tem DDI', () => {
    expect(normalizeWhatsapp('+55 (89) 99999-9999')).toBe('5589999999999')
  })

  it('rejeita números curtos, longos ou com DDD inválido', () => {
    expect(normalizeWhatsapp('99999-9999')).toBeNull()
    expect(normalizeWhatsapp('5589999999999999')).toBeNull()
    expect(normalizeWhatsapp('(00) 99999-9999')).toBeNull()
    expect(normalizeWhatsapp('abc')).toBeNull()
  })
})

describe('normalizeInstagram', () => {
  it('aceita @perfil, perfil e link do perfil', () => {
    expect(normalizeInstagram('@urucuisports')).toBe('urucuisports')
    expect(normalizeInstagram('urucui.sports_1')).toBe('urucui.sports_1')
    expect(normalizeInstagram('https://www.instagram.com/urucuisports/')).toBe('urucuisports')
    expect(normalizeInstagram('instagram.com/urucuisports?igsh=abc')).toBe('urucuisports')
  })

  it('rejeita handle inválido', () => {
    expect(normalizeInstagram('perfil com espaço')).toBeNull()
    expect(normalizeInstagram('a'.repeat(31))).toBeNull()
    expect(normalizeInstagram('@')).toBeNull()
  })
})

describe('normalizeSiteUrl', () => {
  it('prefixa https:// quando o protocolo é omitido', () => {
    expect(normalizeSiteUrl('www.site.com.br')).toBe('https://www.site.com.br')
    expect(normalizeSiteUrl('http://site.com.br/evento')).toBe('http://site.com.br/evento')
  })

  it('rejeita URLs inválidas e protocolos perigosos', () => {
    expect(normalizeSiteUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSiteUrl('ftp://site.com')).toBeNull()
    expect(normalizeSiteUrl('semdominio')).toBeNull()
  })
})

describe('eventSchema', () => {
  const valid = { name: 'Copa Urucuí', startsAt: '2026-12-05T19:30' }

  it('aceita só nome e data; os contatos opcionais viram string vazia', () => {
    const result = eventSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.whatsapp).toBe('')
      expect(result.data.siteUrl).toBe('')
      expect(result.data.instagram).toBe('')
    }
  })

  it('interpreta a data como horário de Brasília', () => {
    const result = eventSchema.parse(valid)
    expect(result.startsAt.toISOString()).toBe('2026-12-05T22:30:00.000Z')
  })

  it('normaliza os contatos preenchidos', () => {
    const result = eventSchema.parse({
      ...valid,
      whatsapp: '(89) 99999-9999',
      siteUrl: 'site.com.br',
      instagram: '@urucuisports',
    })
    expect(result.whatsapp).toBe('5589999999999')
    expect(result.siteUrl).toBe('https://site.com.br')
    expect(result.instagram).toBe('urucuisports')
  })

  it('rejeita data inválida', () => {
    expect(eventSchema.safeParse({ ...valid, startsAt: 'ontem' }).success).toBe(false)
    expect(eventSchema.safeParse({ ...valid, startsAt: '' }).success).toBe(false)
  })

  it('rejeita nome curto e contato inválido', () => {
    expect(eventSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false)
    expect(eventSchema.safeParse({ ...valid, whatsapp: '123' }).success).toBe(false)
    expect(eventSchema.safeParse({ ...valid, instagram: 'a b' }).success).toBe(false)
  })
})

describe('detectCardMimeType', () => {
  it('reconhece JPEG e PNG pelos bytes', () => {
    expect(detectCardMimeType(new Uint8Array(JPEG_BYTES))).toBe('image/jpeg')
    expect(detectCardMimeType(new Uint8Array(PNG_BYTES))).toBe('image/png')
  })

  it('rejeita GIF, WEBP e conteúdo qualquer', () => {
    const gif = new TextEncoder().encode('GIF89a......')
    const webp = new TextEncoder().encode('RIFF....WEBPVP8 ')
    expect(detectCardMimeType(gif)).toBeNull()
    expect(detectCardMimeType(webp)).toBeNull()
    expect(detectCardMimeType(new Uint8Array([]))).toBeNull()
  })
})

describe('validateCardImage', () => {
  it('aceita JPEG e PNG e devolve o tipo detectado', async () => {
    const jpeg = await validateCardImage(makeFile(JPEG_BYTES, 'card.jpg', 'image/jpeg'))
    expect(jpeg).toMatchObject({ ok: true, mimeType: 'image/jpeg' })

    const png = await validateCardImage(makeFile(PNG_BYTES, 'card.png', 'image/png'))
    expect(png).toMatchObject({ ok: true, mimeType: 'image/png' })
  })

  it('usa o conteúdo, não a extensão: PNG enviado como .jpg continua PNG', async () => {
    const result = await validateCardImage(makeFile(PNG_BYTES, 'card.jpg', 'image/jpeg'))
    expect(result).toMatchObject({ ok: true, mimeType: 'image/png' })
  })

  it('rejeita arquivo que se passa por imagem', async () => {
    const fake = new File(['<script>alert(1)</script>'], 'card.png', { type: 'image/png' })
    const result = await validateCardImage(fake)
    expect(result).toEqual({ ok: false, error: 'O card deve ser uma imagem JPG, JPEG ou PNG.' })
  })

  it('rejeita GIF mesmo com o tipo declarado como imagem', async () => {
    const gif = new File(['GIF89a......'], 'card.gif', { type: 'image/gif' })
    expect((await validateCardImage(gif)).ok).toBe(false)
  })

  it('rejeita arquivo acima de 2 MB e arquivo vazio', async () => {
    const big = makeFile(JPEG_BYTES, 'card.jpg', 'image/jpeg', MAX_CARD_BYTES + 1)
    expect(await validateCardImage(big)).toEqual({
      ok: false,
      error: 'O card deve ter no máximo 2 MB.',
    })

    const empty = new File([], 'card.jpg', { type: 'image/jpeg' })
    expect((await validateCardImage(empty)).ok).toBe(false)
  })

  it('aceita arquivo exatamente no limite de 2 MB', async () => {
    const limit = makeFile(JPEG_BYTES, 'card.jpg', 'image/jpeg', MAX_CARD_BYTES)
    expect((await validateCardImage(limit)).ok).toBe(true)
  })
})

describe('eventCardUrl', () => {
  it('inclui a versão para invalidar o cache quando o card muda', () => {
    const url = eventCardUrl({ id: 'abc', updatedAt: new Date('2026-12-01T00:00:00Z') })
    expect(url).toBe(`/api/eventos/abc/card?v=${Date.UTC(2026, 11, 1)}`)
  })
})

describe('startOfTodayBrasilia', () => {
  it('devolve 00:00 de Brasília do dia local, não do dia UTC', () => {
    // 01:00 UTC de 06/12 ainda é 22:00 de 05/12 em Brasília
    const start = startOfTodayBrasilia(new Date('2026-12-06T01:00:00Z'))
    expect(start.toISOString()).toBe('2026-12-05T03:00:00.000Z')
  })

  it('mantém o dia quando já é dia em Brasília', () => {
    const start = startOfTodayBrasilia(new Date('2026-12-06T15:00:00Z'))
    expect(start.toISOString()).toBe('2026-12-06T03:00:00.000Z')
  })
})
