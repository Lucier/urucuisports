import Link from 'next/link'
import { asc, desc, eq, gt, isNull, and } from 'drizzle-orm'
import { db } from '@/database/client'
import { posts, categories, users, advertisers } from '@/database/schema'
import { NewsCarousel } from './NewsCarousel'
import { SerieAStatsCard } from './SerieAStatsCard'
import { MatchesCard } from './MatchesCard'
import { SafeImage } from '@/components/ui/SafeImage'
import { formatDate } from '@/shared/utils'

const AD_SLOTS = 3

export async function NewsHighlights() {
  const [carouselRows, localRows, advertiserRows] = await Promise.all([
    // Carrossel: relevancia > 0, ordenado por relevancia ASC → mais recente DESC
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        categoryName: categories.name,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(gt(posts.relevancia, 0), isNull(posts.deletedAt)))
      .orderBy(asc(posts.relevancia), desc(posts.createdAt))
      .limit(5),

    // Sidebar: categoria "Futebol Local", mais recentes
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(eq(categories.slug, 'futebol-local'), isNull(posts.deletedAt)))
      .orderBy(desc(posts.createdAt))
      .limit(4),

    // Anunciantes
    db
      .select({
        id: advertisers.id,
        name: advertisers.name,
        logoUrl: advertisers.logoUrl,
        url: advertisers.url,
      })
      .from(advertisers)
      .orderBy(asc(advertisers.createdAt)),
  ])

  const mobileAdIndex =
    advertiserRows.length > 0 ? Math.floor(Math.random() * advertiserRows.length) : -1
  const mobileAd = mobileAdIndex >= 0 ? advertiserRows[mobileAdIndex] : null
  const desktopAds = advertiserRows.slice(0, AD_SLOTS)

  const hasNews = carouselRows.length > 0 || localRows.length > 0

  return (
    <section>
      {hasNews && (
        <>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Principais Notícias</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Carrossel — ocupa 2/3 da largura */}
            {carouselRows.length > 0 && (
              <div className="lg:col-span-2">
                <NewsCarousel posts={carouselRows} />
              </div>
            )}

            {/* Sidebar Futebol Local — ocupa 1/3 */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Futebol Local
                </h3>
                <Link
                  href="/noticias?categoria=futebol-local"
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  Ver mais →
                </Link>
              </div>

              {localRows.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma notícia cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {localRows.map((post) => (
                    <Link
                      key={post.id}
                      href={`/noticias/${post.slug}`}
                      className="group flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:border-emerald-200 hover:bg-slate-50"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-emerald-700 to-slate-800">
                        {post.imageUrl && (
                          <SafeImage
                            src={post.imageUrl}
                            alt={post.title}
                            className="absolute inset-0 h-full w-full rounded-lg object-cover"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col justify-between">
                        <h4 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-emerald-700">
                          {post.title}
                        </h4>
                        <span className="mt-1 text-xs text-slate-400">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Anúncios — mobile: 1 sorteado / desktop: grid de 3 */}
          <div className="mt-6">
            {/* Mobile: exibe apenas o anunciante sorteado */}
            <div className="sm:hidden">
              {mobileAd ? (
                <a
                  href={mobileAd.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-40 w-full items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  {mobileAd.logoUrl ? (
                    <SafeImage
                      src={mobileAd.logoUrl}
                      alt={mobileAd.name}
                      width={180}
                      height={96}
                      className="object-contain"
                    />
                  ) : (
                    <span className="px-4 text-center text-lg font-bold text-slate-700">
                      {mobileAd.name}
                    </span>
                  )}
                </a>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <span className="text-sm font-medium text-slate-400">Anuncie aqui</span>
                </div>
              )}
            </div>

            {/* Desktop: grid de 3 slots */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-3">
              {Array.from({ length: AD_SLOTS }).map((_, i) => {
                const adv = desktopAds[i]
                if (!adv) {
                  return (
                    <div
                      key={i}
                      className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-400">Anuncie aqui</span>
                    </div>
                  )
                }
                return (
                  <a
                    key={adv.id}
                    href={adv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    {adv.logoUrl ? (
                      <SafeImage
                        src={adv.logoUrl}
                        alt={adv.name}
                        width={180}
                        height={96}
                        className="object-contain"
                      />
                    ) : (
                      <span className="px-4 text-center text-lg font-bold text-slate-700">
                        {adv.name}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Jogos e Classificação — sempre visíveis */}
      <div className={hasNews ? 'mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2' : 'grid grid-cols-1 gap-6 lg:grid-cols-2'}>
        {/* Jogos */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Jogos</h3>
            <Link
              href="/estatisticas"
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Ver mais →
            </Link>
          </div>
          <MatchesCard />
        </div>

        {/* Classificação */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Classificação
            </h3>
            <Link
              href="/estatisticas"
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Ver mais →
            </Link>
          </div>
          <SerieAStatsCard />
        </div>
      </div>
    </section>
  )
}
