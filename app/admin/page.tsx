'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function AdminPage() {
  const [richieste, setRichieste] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notifica, setNotifica] = useState('')
  const [editing, setEditing] = useState<any | null>(null) // Stato per la modifica
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    if (!isAdmin) { router.push('/dashboard'); return }
    fetchRichieste()
  }, [router])

  const fetchRichieste = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('richieste')
      .select('*, dipendenti!richieste_dipendente_id_fkey(nome, email, cellulare)')
      .order('created_at', { ascending: false })

    if (error) {
      const { data: retry } = await supabase.from('richieste').select('*, dipendenti!fk_dipendente(nome, email, cellulare)').order('created_at', { ascending: false })
      setRichieste(retry || [])
    } else {
      setRichieste(data || [])
    }
    setLoading(false)
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(richieste.map(r => ({
      Dipendente: r.dipendenti?.nome, Tipo: r.tipo_richiesta, Stato: r.stato,
      Dal: r.data_inizio, Al: r.data_fine, Ore: `${r.ora_inizio || ''} - ${r.ora_fine || ''}`
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Richieste")
    XLSX.writeFile(wb, "Report_Assenze.xlsx")
  }

  const handleUpdateStatus = async (r: any, nuovoStato: string) => {
    await supabase.from('richieste').update({ stato: nuovoStato }).eq('id', r.id)
    setNotifica(`Richiesta ${nuovoStato}!`)
    // Mail simulata
    fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ to: r.dipendenti?.email, subject: `Stato: ${nuovoStato}`, html: `Richiesta ${nuovoStato}` })})
    setTimeout(() => setNotifica(''), 3000)
    fetchRichieste()
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const { error } = await supabase.from('richieste').update({
      data_inizio: editing.data_inizio,
      data_fine: editing.data_fine,
      ora_inizio: editing.ora_inizio,
      ora_fine: editing.ora_fine,
      note: editing.note
    }).eq('id', editing.id)

    if (error) alert("Errore nel salvataggio")
    else {
      setEditing(null)
      setNotifica("Modifica salvata!")
      setTimeout(() => setNotifica(''), 3000)
      fetchRichieste()
    }
  }

  if (loading) return <div className="p-20 text-center font-bold text-black">Caricamento...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-10 text-black font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* NOTIFICA */}
        {notifica && <div className="fixed top-5 right-5 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 font-bold animate-bounce uppercase text-xs tracking-widest">{notifica}</div>}

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 gap-6">
          <h1 className="text-4xl font-black tracking-tight">Pannello Admin</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportToExcel} className="bg-green-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs">📊 EXCEL</button>
            <Link href="/admin/calendario" className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs">🗓️ CALENDARIO</Link>
            <Link href="/admin/dipendenti" className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs">👥 DIPENDENTI</Link>
          </div>
        </div>

        {/* LISTA */}
        <div className="grid gap-4">
          {richieste.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 md:w-1/4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl ${r.stato === 'APPROVATA' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {r.tipo_richiesta === 'FERIE' ? '🌴' : '🕒'}
                </div>
                <h3 className="font-extrabold">{r.dipendenti?.nome || 'N.D.'}</h3>
              </div>

              <div className="text-center md:flex-1 text-sm">
                <b>{r.data_inizio}</b> {r.data_fine ? `al ${r.data_fine}` : ''} <br/>
                <span className="text-gray-400 text-xs uppercase font-black">{r.tipo_richiesta} {r.ora_inizio ? `(${r.ora_inizio}-${r.ora_fine})` : ''}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(r)} className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">✏️</button>
                <button onClick={() => handleUpdateStatus(r, 'APPROVATA')} className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">Approva</button>
                <button onClick={() => handleUpdateStatus(r, 'RIFIUTATA')} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">Rifiuta</button>
                <button onClick={() => { const msg = `Ciao! La tua richiesta è stata ${r.stato}.`; window.open(`https://wa.me/${r.dipendenti?.cellulare?.replace('+','') || ''}?text=${encodeURIComponent(msg)}`) }} className="bg-green-500 text-white p-2.5 rounded-xl">💬</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DI MODIFICA */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">Modifica Richiesta</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Data Inizio</label>
                <input type="date" className="w-full p-3 border rounded-xl font-bold" value={editing.data_inizio} onChange={e => setEditing({...editing, data_inizio: e.target.value})} />
              </div>
              {editing.tipo_richiesta !== 'PERMESSO' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Data Fine</label>
                  <input type="date" className="w-full p-3 border rounded-xl font-bold" value={editing.data_fine} onChange={e => setEditing({...editing, data_fine: e.target.value})} />
                </div>
              )}
              {editing.tipo_richiesta === 'PERMESSO' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" className="p-3 border rounded-xl" value={editing.ora_inizio} onChange={e => setEditing({...editing, ora_inizio: e.target.value})} />
                  <input type="time" className="p-3 border rounded-xl" value={editing.ora_fine} onChange={e => setEditing({...editing, ora_fine: e.target.value})} />
                </div>
              )}
              <textarea className="w-full p-3 border rounded-xl text-sm" rows={3} value={editing.note} onChange={e => setEditing({...editing, note: e.target.value})} placeholder="Note..." />
              
              <div className="flex gap-2 pt-4">
                <button onClick={() => setEditing(null)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold">Annulla</button>
                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}