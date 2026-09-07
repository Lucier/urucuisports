import type { Metadata } from 'next'
import { desc } from 'drizzle-orm'
import { db } from '@/database/client'
import { photoAlbums } from '@/database/schema'
import { SafeImage } from '@/components/ui/SafeImage'
import { formatDate } from '@/shared/utils'

export const metadata: Metadata = {
  title: 'Fotos | Urucuí Sports',
  description: 'Galerias de fotos dos campeonatos e eventos esportivos.',
}

export default async function FotosPage() {
  const albums = await db
    .select()
    .from(photoAlbums)
    .orderBy(desc(photoAlbums.createdAt))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Fotos</h1>
        <p className="mt-1 text-gray-500">Clique em um álbum para ver as fotos</p>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="text-6xl" aria-hidden>📷</span>
          <p className="text-lg font-medium text-slate-700">Nenhuma galeria disponível ainda.</p>
          <p className="text-sm text-gray-400">As fotos serão publicadas em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <a
              key={album.id}
              href={album.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Capa */}
              <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-800 to-slate-900">
                {/* Ícone de câmera sempre visível como fallback */}
                <div className="flex h-full items-center justify-center">
                  <svg
                    className="h-16 w-16 text-white/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                {/* Imagem sobreposta ao fallback */}
                {album.coverUrl && (
                  <SafeImage
                    src={album.coverUrl}
                    alt={album.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* Badge "Abrir galeria" */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <span className="flex translate-y-2 items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-800 opacity-0 shadow transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Abrir galeria
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <h2 className="font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="line-clamp-2 text-sm text-gray-500">{album.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                  <time className="text-xs text-gray-400">{formatDate(album.createdAt)}</time>
                  <span className="text-xs font-medium text-emerald-600">Ver fotos ↗</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
