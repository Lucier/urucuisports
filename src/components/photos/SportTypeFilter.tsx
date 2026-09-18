'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/shared/utils'
import { SPORT_TYPES } from '@/shared/constants'

interface Props {
  active: string | null
}

export function SportTypeFilter({ active }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function select(value: string | null) {
    router.push(value ? `${pathname}?esporte=${value}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select(null)}
        className={cn(
          'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
          active === null
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700',
        )}
      >
        Todos
      </button>

      {SPORT_TYPES.map((sport) => (
        <button
          key={sport.value}
          onClick={() => select(sport.value)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            active === sport.value
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700',
          )}
        >
          {sport.label}
        </button>
      ))}
    </div>
  )
}
