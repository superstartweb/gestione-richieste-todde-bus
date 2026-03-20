'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Controlliamo se la mail esiste nella tabella dipendenti
    const { data, error: dbError } = await supabase
      .from('dipendenti')
      .select('*')
      .eq('email', email)
      .single()

    if (dbError || !data) {
      setError('Email non trovata. Contatta l\'amministratore.')
      setLoading(false)
      return
    }

    // 2. Se esiste, salviamo temporaneamente i dati nel browser
    localStorage.setItem('user_email', data.email)
    localStorage.setItem('user_id', data.id)
    localStorage.setItem('user_nome', data.nome)
    localStorage.setItem('is_admin', data.is_admin ? 'true' : 'false')

    // 3. Portiamolo alla pagina delle sue richieste
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">Gestione Richieste</h1>
          <p className="mt-2 text-gray-500">Inserisci la tua mail per accedere</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Aziendale</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="nome@azienda.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Verifica in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </main>
  )
}