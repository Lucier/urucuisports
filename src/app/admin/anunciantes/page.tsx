import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc, count } from 'drizzle-orm'
import { db } from '@/database/client'
import { advertisers } from '@/database/schema'
import { AdvertiserManager } from '@/components/admin/AdvertiserManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Anunciantes — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminAnunciantesPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], rows] = await Promise.all([
    db.select({ value: count() }).from(advertisers),
    db
      .select({
        id: advertisers.id,
        name: advertisers.name,
        logoUrl: advertisers.logoUrl,
        url: advertisers.url,
        createdAt: advertisers.createdAt,
      })
      .from(advertisers)
      .orderBy(desc(advertisers.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Anunciantes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie os anunciantes e patrocinadores do portal
        </p>
      </div>
      <AdvertiserManager advertisers={rows} totalCount={total} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/anunciantes" />
    </div>
  )
}
