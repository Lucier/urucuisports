import Link from 'next/link'

const sections = [
  {
    title: 'Navegação',
    links: [
      { label: 'Início', href: '/' },
      { label: 'Notícias', href: '/noticias' },
      { label: 'Fotos', href: '/fotos' },
      { label: 'Ao Vivo', href: '/transmissoes' },
      { label: 'Jogos', href: '/jogos' },
    ],
  },
]

const leagueLinks = [
  { label: 'Uruçuiense Série A', href: '/estatisticas/campeonato-urucuiense-serie-a' },
  { label: 'Uruçuiense Série B', href: '/estatisticas/campeonato-urucuiense-serie-b' },
  { label: 'Veteranos', href: '/estatisticas/campeonato-urucuiense-veteranos' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-slate-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-1 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                ⚽
              </span>
              <span className="text-lg font-bold text-white">
                Uruçuí <span className="text-emerald-400">Sports</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Seu portal completo de notícias, resultados e classificações do futebol e demais
              esportes uruçuiense.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
              Ligas
            </h3>
            <ul className="space-y-2">
              {leagueLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-emerald-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-2 mt-8 border-t border-slate-800 pt-6 text-center text-xs text-gray-600 sm:col-span-1 sm:mt-10">
          © {year} Uruçuí Sports. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
