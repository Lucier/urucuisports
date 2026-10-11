import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
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
