export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { eq, isNull, and } from 'drizzle-orm'
import { db } from '@/database/client'
import { posts, categories } from '@/database/schema'
import { SafeImage } from '@/components/ui/SafeImage'
import { formatDateTime } from '@/shared/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const [post] = await db
    .select({ title: posts.title, content: posts.content, imageUrl: posts.imageUrl })
    .from(posts)
    .where(and(eq(posts.slug, slug), isNull(posts.deletedAt)))
    .limit(1)

  if (!post) return {}

  const description = post.content.slice(0, 155)

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: post.imageUrl ? [{ url: post.imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  }
}

export async function generateStaticParams() {
  try {
    const slugs = await db
      .select({ slug: posts.slug })
      .from(posts)
      .where(isNull(posts.deletedAt))
    return slugs.map(({ slug }) => ({ slug }))
  } catch {
    return []
  }
}

export default async function NoticiaPage({ params }: PageProps) {
  const { slug } = await params

  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      imageUrl: posts.imageUrl,
      createdAt: posts.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      authorName: posts.authorName,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.slug, slug), isNull(posts.deletedAt)))
    .limit(1)

  if (!post) notFound()

  const paragraphs = post.content.split(/\n+/).filter(Boolean)

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-gray-400 sm:mb-6 sm:gap-2">
        <Link href="/" className="transition hover:text-emerald-600">
          Início
        </Link>
        <span aria-hidden>/</span>
        <Link href="/noticias" className="transition hover:text-emerald-600">
          Notícias
        </Link>
        {post.categoryName && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/noticias?categoria=${post.categorySlug}`}
              className="transition hover:text-emerald-600"
            >
              {post.categoryName}
            </Link>
          </>
        )}
      </nav>

      {/* Category badge */}
      {post.categoryName && (
        <Link
          href={`/noticias?categoria=${post.categorySlug}`}
          className="inline-block rounded bg-emerald-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-600"
        >
          {post.categoryName}
        </Link>
      )}

      {/* Title */}
      <h1 className="mt-4 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
        {post.title}
      </h1>

      {/* Meta: author + date */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5">
        {post.authorName && (
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {post.authorName[0].toUpperCase()}
            </span>
            {post.authorName}
          </span>
        )}
        <time
          dateTime={post.createdAt.toISOString()}
          className="text-sm text-gray-400"
        >
          {formatDateTime(post.createdAt)}
        </time>
      </div>

      {/* Hero image */}
      <div className="relative mt-8 h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-slate-800 to-slate-900 lg:h-80">
        {post.imageUrl && (
          <SafeImage
            src={post.imageUrl}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {/* Article content */}
      <div className="mt-10 space-y-5">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-base leading-8 text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Tags / back link */}
      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
        <Link
          href="/noticias"
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para notícias
        </Link>
        {post.categoryName && (
          <Link
            href={`/noticias?categoria=${post.categorySlug}`}
            className="rounded-full border border-emerald-200 px-4 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            {post.categoryName}
          </Link>
        )}
      </div>

    </article>
  )
}
