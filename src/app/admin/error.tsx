'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin error boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold text-slate-800">Erro no painel administrativo</h2>
      <p className="max-w-md text-slate-500">
        Ocorreu um erro inesperado. Tente novamente ou volte ao dashboard.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-slate-400">Código: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Tentar novamente
        </button>
        <a
          href="/admin/dashboard"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ir ao dashboard
        </a>
      </div>
    </div>
  )
}
