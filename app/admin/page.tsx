'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { Check, X, MessageCircle, Edit3, Trash2, Calendar, Users, BarChart } from 'lucide-react'

export default function AdminPage() {
  const [richieste, setRichieste] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notifica, setNotifica] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    if (!isAdmin) { router.push('/dashboard'); return }
    fetchRichieste()
  }, [router])

  const fetchRichieste = async () => {
    setLoading(true)
    const { data } = await supabase.from('richieste').select('*, dipendenti!richieste_dipendente_id_fkey(nome, email, cellulare)').order('created_at', { ascending: false })
    setRichieste(data || [])
    setLoading(false)
  }

  // FUNZIONE AGGIORNATA SENZA EMAIL - SOLO DATABASE
  const handleUpdateStatus = async (r: any, nuovoStato: string) => {
    const { error } = await supabase.from('richieste').update({ stato: nuovoStato }).eq('id', r.id)
    if (!error) {
      setNotifica(`Stato: ${nuovoStato}`)
      setTimeout(() => setNotifica(''), 3000)
      fetchRichieste()
    }
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(richieste.map(r => ({
      Dipendente: r.dipendenti?.nome, Tipo: r.tipo_richiesta, Dal: r.data_inizio, Al: r.data_fine, Stato: r.stato
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Richieste")
    XLSX.writeFile(wb, "Report_Presenze.xlsx")
  }

  if (loading) return <div className="p-20 text-center font-black uppercase text-slate-300">Caricamento...</div>

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-10 text-[#1e293b]">
      <div className="max-w-7xl mx-auto">
        
        {/* NOTIFICA */}
        {notifica && <div className="fixed top-5 right-5 bg-[#1e293b] text-white px-6 py-4 rounded-2xl shadow-2xl z-[500] font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right">{notifica}</div>}

        {/* HEADER ADMIN */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Gestionale Presenze</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pannello Amministratore</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={exportToExcel} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><BarChart size={16}/> Report</button>
            <Link href="/admin/calendario" className="bg-violet-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Calendar size={16}/> Calendario</Link>
            <Link href="/admin/dipendenti" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Users size={16}/> Personale</Link>
            <Link href="/dashboard" className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase">Home</Link>
          </div>
        </div>

        {/* LISTA RICHIESTE RIVISITATA */}
        <div className="grid gap-4">
          {richieste.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-blue-200 transition-all">
              <div className="flex items-center gap-5 lg:w-1/3">
                <div className={`h-3 w-3 rounded-full shrink-0 ${
                  r.stato === 'APPROVATA' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : r.stato === 'RIFIUTATA' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'
                }`}></div>
                <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                  {r.tipo_richiesta === 'FERIE' ? '🌴' : r.tipo_richiesta === 'MALATTIA' ? '🤒' : '🕒'}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{r.dipendenti?.nome}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-tighter">{r.tipo_richiesta}</span>
                    <span className={`text-[9px] font-black uppercase ${r.stato === 'APPROVATA' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.stato}</span>
                  </div>
                </div>
              </div>

              <div className="text-center md:flex-1 bg-slate-50/50 px-6 py-3 rounded-2xl border border-slate-100">
                <p className="font-black text-sm">{r.data_inizio} {r.data_fine && r.data_fine !== r.data_inizio ? ` al ${r.data_fine}` : ''}</p>
                {r.ora_inizio && <p className="text-[10px] font-black text-blue-500 uppercase mt-1 tracking-tighter">Orario: {r.ora_inizio} - {r.ora_fine}</p>}
                {r.allegato_url && <a href={r.allegato_url} target="_blank" className="text-[9px] font-black text-blue-600 underline uppercase mt-2 block tracking-widest">📎 Vedi Allegato</a>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(r)} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit3 size={18}/></button>
                <button onClick={() => handleUpdateStatus(r, 'APPROVATA')} className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all">Approva</button>
                <button onClick={() => handleUpdateStatus(r, 'RIFIUTATA')} className="bg-rose-50 text-rose-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all">Rifiuta</button>
                <button onClick={() => window.open(`https://wa.me/${r.dipendenti?.cellulare?.replace('+','') || ''}?text=${encodeURIComponent(`Ciao ${r.dipendenti?.nome}, la tua richiesta è stata ${r.stato}.`)}`)} className="bg-emerald-500 text-white p-3 rounded-xl hover:scale-110 transition-all shadow-md shadow-emerald-100"><MessageCircle size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}