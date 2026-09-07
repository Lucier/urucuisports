import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
  extraParams?: Record<string, string>
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items: (number | 'ellipsis')[] = [1]
  if (current > 3) items.push('ellipsis')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    items.push(p)
  }
  if (current < total - 2) items.push('ellipsis')
  items.push(total)
  return items
}

export function Pagination({ page, totalPages, basePath, extraParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  function href(p: number) {
    const params = new URLSearchParams({ ...extraParams, page: String(p) })
    return `${basePath}?${params}`
  }

  const pages = getPageNumbers(page, totalPages)
  const btn =
    'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition'

  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Paginação">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        className={`${btn} ${page === 1 ? 'pointer-events-none text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        ←
      </Link>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        className={`${btn} ${page === totalPages ? 'pointer-events-none text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        →
      </Link>
    </nav>
  )
}
