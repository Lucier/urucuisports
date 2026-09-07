import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/database/client'
import { streams } from '@/database/schema'
import { toEmbedUrl } from '@/lib/youtube'
import { cn } from '@/shared/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const [stream] = await db.select({ title: streams.title }).from(streams).where(eq(streams.id, id)).limit(1)
  if (!stream) return {}
  return { title: `${stream.title} | Transmissões | Urucuí Sports` }
}

const STATUS_LABEL: Record<string, string> = {
  LIVE: 'Ao vivo',
  SCHEDULED: 'Agendado',
  FINISHED: 'Encerrado',
}

export default async function TransmissaoPage({ params }: PageProps) {
  const { id } = await params

  const [stream] = await db
    .select()
    .from(streams)
    .where(eq(streams.id, id))
    .limit(1)

  if (!stream) notFound()

  const embedUrl = toEmbedUrl(stream.url)
  const isLive = stream.status === 'LIVE'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-emerald-600">Início</Link>
        <span>/</span>
        <Link href="/transmissoes" className="hover:text-emerald-600">Transmissões</Link>
        <span>/</span>
        <span className="text-slate-600">{stream.title}</span>
      </nav>

      {/* Player */}
      <div className="overflow-hidden rounded-2xl bg-black shadow-xl">
        {embedUrl ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl}
              title={stream.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <p className="text-gray-400">Player indisponível. <a href={stream.url} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">Abrir no YouTube ↗</a></p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                AO VIVO
              </span>
            )}
            {!isLive && (
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                stream.status === 'FINISHED' ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700',
              )}>
                {STATUS_LABEL[stream.status]}
              </span>
            )}
            {stream.scheduledAt && stream.status === 'SCHEDULED' && (
              <span className="text-sm text-gray-400">
                {new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }).format(new Date(stream.scheduledAt))}
              </span>
            )}
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{stream.title}</h1>
          {stream.description && (
            <p className="mt-2 text-gray-500">{stream.description}</p>
          )}
        </div>

        <a
          href={stream.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-300 hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Abrir no YouTube
        </a>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <Link
          href="/transmissoes"
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Todas as transmissões
        </Link>
      </div>
    </div>
  )
}
