'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center font-sans">
        <h1 className="text-2xl font-bold text-slate-800">Erro crítico</h1>
        <p className="max-w-md text-slate-500">
          A aplicação encontrou um erro grave. Por favor, recarregue a página.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-400">Código: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Recarregar
        </button>
      </body>
    </html>
  )
}
