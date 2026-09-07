import type { MetadataRoute } from 'next'
import { db } from '@/database/client'
import { posts, leagues } from '@/database/schema'
import { isNull, desc } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'https://urucuisportes.com').replace(/\/$/, '')

  const [allPosts, allLeagues] = await Promise.all([
    db
      .select({ slug: posts.slug, createdAt: posts.createdAt })
      .from(posts)
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt)),
    db.select({ slug: leagues.slug }).from(leagues),
  ])

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/noticias`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/estatisticas`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/transmissoes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/fotos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...allPosts.map((p) => ({
      url: `${base}/noticias/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...allLeagues.map((l) => ({
      url: `${base}/estatisticas/${l.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]
}
