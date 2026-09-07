'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/shared/utils'

type Post = {
  id: string
  title: string
  slug: string
  content: string
  imageUrl: string | null
  createdAt: Date
  categoryName: string | null
  authorName: string | null
}

interface Props {
  posts: Post[]
}

export function NewsCarousel({ posts }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % posts.length)
  }, [posts.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + posts.length) % posts.length)
  }, [posts.length])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [next, paused])

  const post = posts[current]

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative min-h-[22rem] lg:min-h-[28rem]">
        {posts.map((p, i) => (
          <div
            key={p.id}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Fundo: gradiente sempre visível + imagem sobreposta */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900" />
            {p.imageUrl && (
              <Image
                src={p.imageUrl}
                alt={p.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <Link href={`/noticias/${p.slug}`} className="group absolute inset-0 z-10 flex flex-col justify-end p-6 lg:p-8">
              {p.categoryName && (
                <span className="mb-3 inline-block w-fit rounded bg-emerald-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  {p.categoryName}
                </span>
              )}
              <h3 className="text-xl font-bold leading-tight text-white transition-colors group-hover:text-emerald-300 lg:text-3xl">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-gray-300 lg:text-base">
                {p.content.slice(0, 160)}…
              </p>
              <p className="mt-3 text-xs text-gray-400">
                {p.authorName && `${p.authorName} · `}
                {formatDate(p.createdAt)}
              </p>
            </Link>
          </div>
        ))}
      </div>

      {/* Seta esquerda */}
      <button
        onClick={prev}
        aria-label="Notícia anterior"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Seta direita */}
      <button
        onClick={next}
        aria-label="Próxima notícia"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots de navegação */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {posts.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para notícia ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-emerald-400' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* Barra de progresso */}
      {!paused && (
        <div
          key={current}
          className="absolute bottom-0 left-0 z-20 h-0.5 bg-emerald-400"
          style={{ animation: 'progress 6s linear forwards' }}
        />
      )}

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}
