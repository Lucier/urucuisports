import Image from 'next/image'
import { asc, gte } from 'drizzle-orm'
import { db } from '@/database/client'
import { events } from '@/database/schema'
import { eventCardUrl } from '@/modules/events/card'
import { formatDateTime, startOfTodayBrasilia } from '@/shared/utils'

const MAX_EVENTS = 3

type SportsEvent = {
  id: string
  name: string
  startsAt: Date
  whatsapp: string | null
  siteUrl: string | null
  instagram: string | null
  updatedAt: Date
}

function whatsappUrl(event: SportsEvent) {
  const message = `Olá! Gostaria de saber mais sobre o evento "${event.name}".`
  return `https://wa.me/${event.whatsapp}?text=${encodeURIComponent(message)}`
}

const linkBase =
  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none'

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M2 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5l-4.05 3.24A.75.75 0 0 1 3.25 16.65V14.9A3 3 0 0 1 2 12.5V5Z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function EventCard({ event }: { event: SportsEvent }) {
  const hasLinks = event.whatsapp || event.siteUrl || event.instagram

  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-colors hover:border-emerald-200">
      {/* Card de divulgação (rota de imagem dinâmica: sem otimização do next/image) */}
      <Image
        src={eventCardUrl(event)}
        alt={`Card de divulgação: ${event.name}`}
        width={1200}
        height={800}
        unoptimized
        className="block h-auto w-full"
      />

      <div className="space-y-3 p-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{event.name}</h4>
          <p className="text-xs text-slate-500">{formatDateTime(event.startsAt)}</p>
        </div>

        {hasLinks && (
          <div className="flex flex-wrap gap-2">
            {event.whatsapp && (
              <a
                href={whatsappUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Entre em contato com a organização de ${event.name} pelo WhatsApp`}
                className={`${linkBase} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                <ChatIcon />
                WhatsApp
              </a>
            )}
            {event.siteUrl && (
              <a
                href={event.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Site do evento ${event.name}`}
                className={`${linkBase} border border-slate-200 text-slate-700 hover:bg-slate-50`}
              >
                <GlobeIcon />
                Site
              </a>
            )}
            {event.instagram && (
              <a
                href={`https://www.instagram.com/${event.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram do evento ${event.name}`}
                className={`${linkBase} border border-pink-200 text-pink-600 hover:bg-pink-50`}
              >
                <InstagramIcon />
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export async function EventsSection() {
  // Do início de hoje (Brasília) em diante: o evento continua visível durante o próprio dia.
  const upcoming = await db
    .select({
      id: events.id,
      name: events.name,
      startsAt: events.startsAt,
      whatsapp: events.whatsapp,
      siteUrl: events.siteUrl,
      instagram: events.instagram,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .where(gte(events.startsAt, startOfTodayBrasilia()))
    .orderBy(asc(events.startsAt))
    .limit(MAX_EVENTS)

  if (upcoming.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide text-slate-700 uppercase">Eventos</h3>
      </div>
      <div className="flex flex-col gap-3">
        {upcoming.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
