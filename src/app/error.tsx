'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-800">Algo deu errado</h2>
      <p className="max-w-md text-slate-500">
        Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-slate-400">Código: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  )
}
