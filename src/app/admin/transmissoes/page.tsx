import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc, count } from 'drizzle-orm'
import { db } from '@/database/client'
import { streams } from '@/database/schema'
import { StreamManager } from '@/components/admin/StreamManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Transmissões — Admin | Urucuí Esportes' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminTransmissoesPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], rows] = await Promise.all([
    db.select({ value: count() }).from(streams),
    db.select().from(streams).orderBy(desc(streams.createdAt)).limit(PAGE_SIZE).offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Transmissões</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie links de transmissões ao vivo pelo YouTube
        </p>
      </div>
      <StreamManager streams={rows} totalCount={total} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/transmissoes" />
    </div>
  )
}
