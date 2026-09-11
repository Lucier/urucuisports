export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/database/client'
import { streams } from '@/database/schema'
import { toThumbnailUrl } from '@/lib/youtube'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/shared/utils'

export const metadata: Metadata = {
  title: 'Transmissões | Urucuí Sports',
  description: 'Assista às partidas ao vivo pelo YouTube.',
}

const STATUS_ORDER = { LIVE: 0, SCHEDULED: 1, FINISHED: 2 }

const STATUS_LABEL: Record<string, string> = {
  LIVE: 'Ao vivo',
  SCHEDULED: 'Agendado',
  FINISHED: 'Encerrado',
}

export default async function TransmissoesPage() {
  const rows = await db.select().from(streams).orderBy(desc(streams.createdAt))

  const sorted = [...rows].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Transmissões</h1>
        <p className="mt-1 text-gray-500">Assista às partidas ao vivo pelo YouTube</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="text-6xl" aria-hidden>📺</span>
          <p className="text-lg font-medium text-slate-700">Nenhuma transmissão disponível.</p>
          <p className="text-sm text-gray-400">As transmissões serão publicadas em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((stream) => {
            const thumb = toThumbnailUrl(stream.url)
            const isLive = stream.status === 'LIVE'
            const isFinished = stream.status === 'FINISHED'

            return (
              <Link
                key={stream.id}
                href={`/transmissoes/${stream.id}`}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  isLive ? 'border-red-200' : 'border-slate-100',
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  {/* Ícone do YouTube como fallback sempre visível */}
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-14 w-14 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  {/* Thumbnail sobreposto ao fallback */}
                  {thumb && (
                    <SafeImage
                      src={thumb}
                      alt={stream.title}
                      className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
                        isFinished && 'opacity-60 grayscale',
                      )}
                    />
                  )}

                  {/* Play overlay */}
                  {!isFinished && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <div className="flex h-14 w-14 translate-y-1 items-center justify-center rounded-full bg-red-600/90 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
                        <svg className="h-6 w-6 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Badge de status */}
                  <div className="absolute left-3 top-3">
                    {isLive && (
                      <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        AO VIVO
                      </span>
                    )}
                    {!isLive && (
                      <span className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        isFinished
                          ? 'bg-slate-800/70 text-slate-300'
                          : 'bg-slate-900/70 text-white',
                      )}>
                        {STATUS_LABEL[stream.status]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h2 className={cn(
                    'font-bold leading-snug',
                    isFinished ? 'text-slate-500' : 'text-slate-900 group-hover:text-red-600',
                  )}>
                    {stream.title}
                  </h2>
                  {stream.description && (
                    <p className="line-clamp-2 text-sm text-gray-500">{stream.description}</p>
                  )}
                  {stream.scheduledAt && stream.status === 'SCHEDULED' && (
                    <p className="mt-auto text-xs text-gray-400">
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }).format(new Date(stream.scheduledAt))}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
