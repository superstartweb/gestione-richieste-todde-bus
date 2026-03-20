'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GestioneDipendenti() {
  const [dipendenti, setDipendenti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Stato per il nuovo dipendente
  const [newDip, setNewDip] = useState({
    nome: '',
    email: '',
    cellulare: '',
    is_admin: false
  })

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchDipendenti()
  }, [router])

  const fetchDipendenti = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dipendenti')
      .select('*')
      .order('nome', { ascending: true })

    if (error) console.error(error)
    else setDipendenti(data || [])
    setLoading(false)
  }

  const handleAddDipendente = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('dipendenti').insert([newDip])

    if (error) {
      alert("Errore nell'inserimento: " + error.message)
    } else {
      alert("Dipendente aggiunto con successo!")
      setNewDip({ nome: '', email: '', cellulare: '', is_admin: false })
      setShowForm(false)
      fetchDipendenti()
    }
  }

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('dipendenti')
      .update({ is_admin: !currentStatus })
      .eq('id', id)
    
    if (error) alert("Errore")
    else fetchDipendenti()
  }

  if (loading) return <div className="p-10 text-center text-black">Caricamento...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-10 text-black">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="text-blue-600 text-sm font-bold hover:underline">← Torna alle Richieste</Link>
            <h1 className="text-3xl font-black text-gray-900 mt-2">Anagrafica Dipendenti</h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
          >
            {showForm ? 'Annulla' : '+ AGGIUNGI ORA'}
          </button>
        </div>

        {/* FORM AGGIUNTA (si vede solo se clicchi il tasto) */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4">Dati Nuovo Dipendente</h2>
            <form onSubmit={handleAddDipendente} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" placeholder="Nome e Cognome" required 
                className="p-3 border rounded-lg"
                value={newDip.nome} onChange={e => setNewDip({...newDip, nome: e.target.value})}
              />
              <input 
                type="email" placeholder="Email aziendale" required 
                className="p-3 border rounded-lg"
                value={newDip.email} onChange={e => setNewDip({...newDip, email: e.target.value})}
              />
              <input 
                type="text" placeholder="Cellulare (es. +39333...)" required 
                className="p-3 border rounded-lg"
                value={newDip.cellulare} onChange={e => setNewDip({...newDip, cellulare: e.target.value})}
              />
              <div className="flex items-center gap-2 px-3">
                <input 
                  type="checkbox" id="isAdmin" 
                  checked={newDip.is_admin} onChange={e => setNewDip({...newDip, is_admin: e.target.checked})}
                />
                <label htmlFor="isAdmin" className="text-sm font-medium">Imposta come Amministratore</label>
              </div>
              <button type="submit" className="md:col-span-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all">
                SALVA DIPENDENTE
              </button>
            </form>
          </div>
        )}

        {/* TABELLA LISTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Nome</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Ruolo</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dipendenti.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold">{d.nome}</td>
                  <td className="p-4 text-gray-600">{d.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${d.is_admin ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {d.is_admin ? 'ADMIN' : 'DIPENDENTE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleAdmin(d.id, d.is_admin)}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      {d.is_admin ? 'Rendi Dipendente' : 'Rendi Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}