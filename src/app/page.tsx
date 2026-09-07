export const dynamic = 'force-dynamic'

import { NewsHighlights } from '@/components/home/NewsHighlights'

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-12 sm:py-10">
      <NewsHighlights />
    </div>
  )
}
