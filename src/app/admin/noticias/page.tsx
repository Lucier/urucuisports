export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq, desc, count, isNull } from 'drizzle-orm'
import { db } from '@/database/client'
import { categories, posts } from '@/database/schema'
import { PostFormSection } from '@/components/admin/PostFormSection'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Notícias | Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminNoticiasPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')

  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [categoryRows, [{ value: total }], postRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ value: count() }).from(posts).where(isNull(posts.deletedAt)),
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        imageUrl: posts.imageUrl,
        categoryId: posts.categoryId,
        categoryName: categories.name,
        authorName: posts.authorName,
        relevancia: posts.relevancia,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie notícias, partidas e fotos</p>
      </div>

      <div className="space-y-12">
        <PostFormSection categories={categoryRows} initialPosts={postRows} adminId={userId} />
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/admin/noticias" />
    </div>
  )
}
