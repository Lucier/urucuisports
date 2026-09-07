import type { Metadata } from 'next'
import { desc, eq, isNull, and } from 'drizzle-orm'
import { db } from '@/database/client'
import { posts, categories, users } from '@/database/schema'
import { CategoryFilter } from '@/components/news/CategoryFilter'
import { PostCard } from '@/components/news/PostCard'

export const metadata: Metadata = {
  title: 'Notícias',
  description: 'Todas as notícias do mundo esportivo.',
}

interface PageProps {
  searchParams: Promise<{ categoria?: string }>
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  const { categoria } = await searchParams

  const baseSelect = {
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    categoryName: categories.name,
    categorySlug: categories.slug,
    authorName: users.name,
  }

  const [allCategories, rows] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),

    db
      .select(baseSelect)
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(
        categoria
          ? and(isNull(posts.deletedAt), eq(categories.slug, categoria))
          : isNull(posts.deletedAt),
      )
      .orderBy(desc(posts.createdAt))
      .limit(100),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Notícias</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">Fique por dentro de tudo que acontece no esporte</p>
      </div>

      {/* Filtro de categorias */}
      <CategoryFilter categories={allCategories} activeSlug={categoria ?? null} />

      {/* Grade de posts */}
      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl" aria-hidden>
            📭
          </span>
          <p className="text-lg font-medium text-slate-700">
            Nenhuma notícia encontrada nesta categoria.
          </p>
          <p className="text-sm text-gray-400">Tente selecionar outra categoria acima.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
