import Image from 'next/image'

/**
 * WhatsApp que recebe os contatos dos eventos, no formato internacional, só dígitos
 * (55 + DDD + número). ATENÇÃO: valor provisório e inválido — troque pelo número real.
 */
const WHATSAPP_NUMBER = '5589000000000'

type SportsEvent = {
  id: string
  name: string
  /** Banner de divulgação (arquivo em public/eventos) */
  bannerSrc: string
  /** Data e hora de início, em horário de Brasília (-03:00) */
  startsAt: Date
  location: string
}

// Conteúdo de exemplo — ainda não há tabela de eventos no banco.
const EVENTS: SportsEvent[] = [
  {
    id: 'copa-urucui-futsal',
    bannerSrc: '/eventos/copa-urucui-futsal.svg',
    name: 'Abertura da Copa Urucuí de Futsal',
    startsAt: new Date('2026-12-05T19:30:00-03:00'),
    location: 'Ginásio Poliesportivo Municipal',
  },
  {
    id: 'festival-society',
    bannerSrc: '/eventos/festival-society.svg',
    name: 'Festival de Futebol Society',
    startsAt: new Date('2026-12-12T08:00:00-03:00'),
    location: 'Campo do Parque de Exposições',
  },
  {
    id: 'torneio-veteranos',
    bannerSrc: '/eventos/torneio-veteranos.svg',
    name: 'Torneio de Veteranos do Urucuiense',
    startsAt: new Date('2026-12-19T16:00:00-03:00'),
    location: 'Estádio Municipal de Urucuí',
  },
]

function whatsappUrl(event: SportsEvent) {
  const message = `Olá! Gostaria de saber mais sobre o evento "${event.name}".`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M2 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5l-4.05 3.24A.75.75 0 0 1 3.25 16.65V14.9A3 3 0 0 1 2 12.5V5Z" />
    </svg>
  )
}

function EventCard({ event }: { event: SportsEvent }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-colors hover:border-emerald-200">
      {/* Banner de divulgação (SVG estático: sem otimização do next/image) */}
      <Image
        src={event.bannerSrc}
        alt={`Banner de divulgação: ${event.name}`}
        width={1200}
        height={400}
        unoptimized
        className="block h-auto w-full"
      />

      <div className="p-3">
        <a
          href={whatsappUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Entre em contato com a organização de ${event.name} pelo WhatsApp`}
          className="flex w-full items-center justify-center gap-2 rounded-lg text-center bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ChatIcon />
          Entre em contato com a organização
        </a>
      </div>
    </article>
  )
}

export function EventsSection() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide text-slate-700 uppercase">Eventos</h3>
      </div>
      <div className="flex flex-col gap-3">
        {EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
