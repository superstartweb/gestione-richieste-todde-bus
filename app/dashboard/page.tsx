'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<{nome: string, id: string, is_admin: boolean} | null>(null)
  const [tipo, setTipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const [formData, setFormData] = useState({
    data_inizio: '',
    data_fine: '',
    ora_inizio: '',
    ora_fine: '',
    note: ''
  })

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    const nome = localStorage.getItem('user_nome')
    const id = localStorage.getItem('user_id')
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    
    if (!email) {
      router.push('/')
    } else {
      setUser({ nome: nome || '', id: id || '', is_admin: isAdmin })
    }
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let fileUrl = null

    try {
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('allegati')
          .upload(fileName, file)
        
        if (uploadError) throw new Error("Errore caricamento file: " + uploadError.message)

        const { data: publicUrl } = supabase.storage.from('allegati').getPublicUrl(fileName)
        fileUrl = publicUrl.publicUrl
      }

      const { error: dbError } = await supabase.from('richieste').insert([{
        dipendente_id: user?.id,
        tipo_richiesta: tipo,
        data_inizio: formData.data_inizio || null,
        data_fine: tipo === 'PERMESSO' ? formData.data_inizio : (formData.data_fine || null),
        ora_inizio: tipo === 'PERMESSO' ? formData.ora_inizio : null,
        ora_fine: tipo === 'PERMESSO' ? formData.ora_fine : null,
        allegato_url: fileUrl,
        note: formData.note || '',
        stato: 'PENDENTE',
        status: 'pending'
      }])

      if (dbError) throw dbError

      setMessaggio("Richiesta inviata! L'amministratore la riceverà a breve.")
      setTipo('')
      setFile(null)
      setFormData({ data_inizio: '', data_fine: '', ora_inizio: '', ora_fine: '', note: '' })

    } catch (err: any) {
      alert("ERRORE: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="p-10 text-black font-bold text-center">Inizializzazione...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-black font-sans">
      <div className="max-w-xl mx-auto">
        
        {/* HEADER CON TASTI NAVIGAZIONE */}
        <div className="flex justify-between items-start mb-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">Ciao {user.nome},</h1>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tight">Modulo Richieste</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
                onClick={handleLogout}
                className="text-[10px] font-black bg-gray-100 hover:bg-red-50 hover:text-red-600 px-4 py-1.5 rounded-full transition-all uppercase"
            >
              Esci
            </button>
            {user.is_admin && (
                <Link 
                    href="/admin" 
                    className="text-[10px] font-black bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full hover:bg-purple-600 hover:text-white transition-all uppercase"
                >
                    Pannello Admin →
                </Link>
            )}
          </div>
        </div>

        {/* MODULO RICHIESTA */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          {messaggio ? (
            <div className="bg-green-50 border-2 border-green-100 p-10 rounded-[2rem] text-center animate-in zoom-in duration-300">
              <span className="text-6xl block mb-4">✅</span>
              <p className="text-green-700 font-black text-xl mb-6">{messaggio}</p>
              <button 
                onClick={() => setMessaggio('')} 
                className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-105 transition-all"
              >
                Nuova Richiesta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Tipo di richiesta</label>
                <select 
                  required 
                  className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50 font-bold text-lg focus:border-blue-500 outline-none transition-all cursor-pointer"
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="">Scegli opzione...</option>
                  <option value="FERIE">🌴 FERIE</option>
                  <option value="PERMESSO">🕒 PERMESSO</option>
                  <option value="MALATTIA">🤒 MALATTIA</option>
                  <option value="CONGEDO PARENTALE">👶 CONGEDO</option>
                  <option value="LUTTO">🖤 LUTTO</option>
                </select>
              </div>

              {tipo && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* DATE DENTRO BOX GRIGIO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{tipo === 'PERMESSO' ? 'Giorno' : 'Dal giorno'}</label>
                      <input type="date" required className="w-full bg-transparent font-bold outline-none" value={formData.data_inizio} onChange={e => setFormData({...formData, data_inizio: e.target.value})} />
                    </div>
                    {tipo !== 'PERMESSO' && (
                      <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Al giorno</label>
                        <input type="date" required className="w-full bg-transparent font-bold outline-none" value={formData.data_fine} onChange={e => setFormData({...formData, data_fine: e.target.value})} />
                      </div>
                    )}
                  </div>

                  {/* ORE (SOLO PER PERMESSO) */}
                  {tipo === 'PERMESSO' && (
                    <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-blue-400 mb-1">Dalle ore</label>
                        <input type="time" required className="w-full bg-transparent font-black text-blue-600 outline-none" value={formData.ora_inizio} onChange={e => setFormData({...formData, ora_inizio: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-blue-400 mb-1">Alle ore</label>
                        <input type="time" required className="w-full bg-transparent font-black text-blue-600 outline-none" value={formData.ora_fine} onChange={e => setFormData({...formData, ora_fine: e.target.value})} />
                      </div>
                    </div>
                  )}

                  {/* ALLEGATO */}
                  {(tipo === 'MALATTIA' || tipo === 'CONGEDO PARENTALE') && (
                    <div className="p-5 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/30">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Carica Certificato (Immagine o PDF)</label>
                      <input 
                        type="file" 
                        className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                        onChange={e => setFile(e.target.files?.[0] || null)} 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Note aggiuntive</label>
                    <textarea 
                        className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50 outline-none focus:border-blue-500 transition-all" 
                        rows={3} 
                        placeholder="Inserisci eventuali dettagli o motivi..." 
                        value={formData.note} 
                        onChange={e => setFormData({...formData, note: e.target.value})} 
                    />
                  </div>

                  <button 
                    disabled={loading} 
                    className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300"
                  >
                    {loading ? 'INVIO IN CORSO...' : 'INVIA RICHIESTA'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}