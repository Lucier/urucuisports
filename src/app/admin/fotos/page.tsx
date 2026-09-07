export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc, count } from 'drizzle-orm'
import { db } from '@/database/client'
import { photoAlbums } from '@/database/schema'
import { PhotoAlbumManager } from '@/components/admin/PhotoAlbumManager'
import { Pagination } from '@/components/admin/Pagination'

export const metadata = { title: 'Fotos — Admin | Urucuí Sports' }

const PAGE_SIZE = 10

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminFotosPage({ searchParams }: Props) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')

  if (!userId || userRole !== 'ADMIN') redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [[{ value: total }], albums] = await Promise.all([
    db.select({ value: count() }).from(photoAlbums),
    db.select().from(photoAlbums).orderBy(desc(photoAlbums.createdAt)).limit(PAGE_SIZE).offset(offset),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Álbuns de Fotos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre links de repositórios de fotos (Google Drive, Flickr, etc.)
        </p>
      </div>
      <PhotoAlbumManager albums={albums} totalCount={total} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/fotos" />
    </div>
  )
}
