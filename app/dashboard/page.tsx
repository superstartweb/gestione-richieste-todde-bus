'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, FileText, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [tipo, setTipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [mieRichieste, setMieRichieste] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const [formData, setFormData] = useState({
    data_inizio: '', data_fine: '', ora_inizio: '', ora_fine: '', note: ''
  })

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    if (!email) { router.push('/'); return }
    setUser({ nome: localStorage.getItem('user_nome'), id: localStorage.getItem('user_id'), is_admin: localStorage.getItem('is_admin') === 'true' })
    fetchMieRichieste()
  }, [router])

  const fetchMieRichieste = async () => {
    const id = localStorage.getItem('user_id')
    const { data } = await supabase.from('richieste').select('*').eq('dipendente_id', id).order('created_at', { ascending: false })
    setMieRichieste(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let fileUrl = null
    try {
      if (file) {
        const fileName = `${Date.now()}_${file.name}`
        await supabase.storage.from('allegati').upload(fileName, file)
        const { data } = supabase.storage.from('allegati').getPublicUrl(fileName)
        fileUrl = data.publicUrl
      }
      await supabase.from('richieste').insert([{
        dipendente_id: user?.id, tipo_richiesta: tipo, ...formData,
        data_fine: tipo === 'PERMESSO' ? formData.data_inizio : formData.data_fine,
        allegato_url: fileUrl, stato: 'PENDENTE'
      }])
      setMessaggio("Richiesta inviata correttamente!")
      setTipo(''); setFile(null); fetchMieRichieste()
    } catch (err) { alert("Errore") }
    setLoading(false)
  }

  if (!user) return <div className="p-20 text-center font-bold">Caricamento...</div>

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* HEADER PROFESSIONALE */}
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
              {user.nome.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-black leading-none">Ciao, {user.nome}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Pannello Dipendente</p>
            </div>
          </div>
          <div className="flex gap-2">
            {user.is_admin && <button onClick={() => router.push('/admin')} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all" title="Admin"><LayoutDashboard size={20}/></button>}
            <button onClick={() => { localStorage.clear(); router.push('/') }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all" title="Esci"><LogOut size={20}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* COLONNA SINISTRA: FORM */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> Nuova Richiesta</h2>
              
              {messaggio ? (
                <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-100">
                  <p className="text-green-700 font-bold mb-4">{messaggio}</p>
                  <button onClick={() => setMessaggio('')} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase">Invia un'altra</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Tipo Assenza...</option>
                    <option value="FERIE">🌴 FERIE</option>
                    <option value="PERMESSO">🕒 PERMESSO</option>
                    <option value="MALATTIA">🤒 MALATTIA</option>
                    <option value="CONGEDO PARENTALE">👶 CONGEDO</option>
                  </select>

                  {tipo && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <label className="text-[10px] font-black text-slate-400 uppercase">{tipo === 'PERMESSO' ? 'Giorno' : 'Inizio'}</label>
                          <input type="date" required className="w-full bg-transparent font-bold outline-none" onChange={e => setFormData({...formData, data_inizio: e.target.value})} />
                        </div>
                        {tipo !== 'PERMESSO' && (
                          <div className="bg-slate-50 p-3 rounded-2xl">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fine</label>
                            <input type="date" required className="w-full bg-transparent font-bold outline-none" onChange={e => setFormData({...formData, data_fine: e.target.value})} />
                          </div>
                        )}
                      </div>

                      {tipo === 'PERMESSO' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-3 rounded-2xl">
                            <label className="text-[10px] font-black text-blue-400 uppercase">Dalle</label>
                            <input type="time" required className="w-full bg-transparent font-bold text-blue-600 outline-none" onChange={e => setFormData({...formData, ora_inizio: e.target.value})} />
                          </div>
                          <div className="bg-blue-50 p-3 rounded-2xl">
                            <label className="text-[10px] font-black text-blue-400 uppercase">Alle</label>
                            <input type="time" required className="w-full bg-transparent font-bold text-blue-600 outline-none" onChange={e => setFormData({...formData, ora_fine: e.target.value})} />
                          </div>
                        </div>
                      )}

                      {(tipo === 'MALATTIA' || tipo === 'CONGEDO PARENTALE') && (
                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Allega Documento</label>
                          <input type="file" className="text-[10px] w-full" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </div>
                      )}

                      <button disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                        {loading ? 'INVIO...' : 'INVIA RICHIESTA'}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* COLONNA DESTRA: STORICO */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-lg font-black flex items-center gap-2 px-2"><Clock size={20} className="text-slate-400"/> Storico Richieste</h2>
            <div className="grid gap-3">
              {mieRichieste.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                      r.stato === 'APPROVATA' ? 'bg-green-100 text-green-600' : r.stato === 'RIFIUTATA' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {r.tipo_richiesta === 'FERIE' ? '🌴' : r.tipo_richiesta === 'MALATTIA' ? '🤒' : '🕒'}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.data_inizio} {r.data_fine && r.data_fine !== r.data_inizio ? ` - ${r.data_fine}` : ''}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{r.tipo_richiesta}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                      r.stato === 'APPROVATA' ? 'bg-green-500 text-white' : r.stato === 'RIFIUTATA' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-white animate-pulse'
                    }`}>
                      {r.stato}
                    </span>
                    <ChevronRight size={16} className="text-slate-300"/>
                  </div>
                </div>
              ))}
              {mieRichieste.length === 0 && <p className="text-center p-10 text-slate-300 italic text-sm">Nessuna richiesta inviata.</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}