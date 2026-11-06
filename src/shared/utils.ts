import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Interpreta o valor de um <input type="datetime-local"> (ex: "2026-11-05T14:30",
 * sem fuso) como horário de Brasília. O Brasil não adota mais horário de verão
 * (desde 2019), então America/Sao_Paulo é um offset fixo de -03:00.
 * Retorna null se o valor for inválido.
 */
export function parseBrasiliaDateTime(value: string): Date | null {
  const withSeconds = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${withSeconds}-03:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Formata uma data para o valor de um <input type="datetime-local"> no horário
 * de Brasília, independente do fuso do navegador. Inverso de parseBrasiliaDateTime.
 */
export function toDateTimeLocalValue(date: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(date))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/**
 * Converte qualquer link de compartilhamento do Google Drive para URL direta
 * com resolução original (=s0). Sem isso, o Drive serve um thumbnail comprimido.
 *
 * Formatos aceitos:
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 *   https://lh3.googleusercontent.com/d/FILE_ID   (já CDN, mas sem tamanho)
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    // Já está no CDN do Google — garante o parâmetro =s0
    if (url.includes('lh3.googleusercontent.com')) {
      const base = url.split('=')[0]
      return `${base}=s0`
    }

    // drive.google.com/file/d/FILE_ID/...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
    if (fileMatch) {
      return `https://lh3.googleusercontent.com/d/${fileMatch[1]}=s0`
    }

    // drive.google.com/open?id=FILE_ID ou /uc?...id=FILE_ID
    const idMatch = url.match(/[?&]id=([^&]+)/)
    if (idMatch && url.includes('drive.google.com')) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}=s0`
    }

    return url
  } catch {
    return url
  }
}

export function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
