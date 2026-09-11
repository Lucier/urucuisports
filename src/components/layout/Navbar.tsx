'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Notícias', href: '/noticias' },
  { label: 'Fotos', href: '/fotos' },
  { label: 'Ao Vivo', href: '/transmissoes' },
  { label: 'Jogos', href: '/estatisticas' },
]

const adminLinks = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Notícias', href: '/admin/noticias' },
  { label: 'Ligas', href: '/admin/ligas' },
  { label: 'Times', href: '/admin/times' },
  { label: 'Jogadores', href: '/admin/jogadores' },
  { label: 'Fotos', href: '/admin/fotos' },
  { label: 'Rodadas', href: '/admin/rodadas' },
  { label: 'Transmissões', href: '/admin/transmissoes' },
  { label: 'Anunciantes', href: '/admin/anunciantes' },
  { label: 'Usuários', href: '/admin/usuarios' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = pathname.startsWith('/admin')

  function isAdminLinkActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-800">Sair da conta?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Você precisará fazer login novamente para acessar o painel.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loggingOut ? 'Saindo…' : 'Confirmar saída'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl" aria-hidden>
              ⚽
            </span>
            <span>
              Uruçuí <span className="text-emerald-400">Sports</span>
            </span>
          </Link>

          {!isAdmin && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <button
            className="rounded-md p-2 text-gray-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {!isAdmin && open && (
          <nav className="border-t border-slate-800 py-3 md:hidden" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {isAdmin && open && (
          <nav className="border-t border-slate-800 py-3 md:hidden" aria-label="Admin mobile">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isAdminLinkActive(link.href)
                    ? 'text-emerald-400'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-slate-800 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setShowLogoutConfirm(true)
                }}
                className="block w-full rounded-md px-4 py-2 text-left text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300"
              >
                Sair da conta
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
