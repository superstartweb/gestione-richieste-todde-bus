'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval,
  parseISO
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [richieste, setRichieste] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    if (!isAdmin) { router.push('/'); return }
    fetchRichieste()
  }, [currentMonth])

  const fetchRichieste = async () => {
    setLoading(true)
    // Prendiamo solo le richieste APPROVATE per il calendario
    const { data } = await supabase
      .from('richieste')
      .select('*, dipendenti(nome)')
      .eq('stato', 'APPROVATA')
    
    setRichieste(data || [])
    setLoading(false)
  }

  // Generazione giorni calendario
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const getDayRequests = (day: Date) => {
    return richieste.filter(r => {
      const start = parseISO(r.data_inizio)
      const end = r.data_fine ? parseISO(r.data_fine) : start
      return isWithinInterval(day, { start, end })
    })
  }

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case 'FERIE': return 'bg-green-100 text-green-700 border-green-200'
      case 'MALATTIA': return 'bg-red-100 text-red-700 border-red-200'
      case 'PERMESSO': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER CALENDARIO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black capitalize">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h1>
              <p className="text-sm text-gray-400 font-bold">Visualizzazione Assenze Confermate</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-all border shadow-sm"><ChevronLeft /></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 bg-white border font-bold text-xs rounded-xl shadow-sm hover:bg-gray-50 uppercase">Oggi</button>
            <button onClick={() => addMonths(currentMonth, 1)} className="p-2 hover:bg-gray-100 rounded-full transition-all border shadow-sm" onClickCapture={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></button>
            <Link href="/admin" className="ml-4 bg-gray-900 text-white px-5 py-2 rounded-xl font-bold text-xs">LISTA</Link>
          </div>
        </div>

        {/* GRIGLIA CALENDARIO */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="p-4 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">{day}</div>
            ))}
          </div>

          {/* Giorni del mese */}
          <div className="grid grid-cols-7 divide-x divide-y border-l border-t min-h-[600px]">
            {calendarDays.map((day, idx) => {
              const dayRequests = getDayRequests(day)
              return (
                <div 
                  key={idx} 
                  className={`p-2 min-h-[120px] transition-all hover:bg-gray-50/50 ${!isSameMonth(day, monthStart) ? 'bg-gray-50/30' : ''}`}
                >
                  <div className={`text-sm font-bold mb-2 ml-1 ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white h-7 w-7 flex items-center justify-center rounded-full shadow-lg shadow-blue-200' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayRequests.map((r, i) => (
                      <div 
                        key={i} 
                        className={`text-[9px] px-2 py-1 rounded-md border font-black truncate shadow-sm ${getTipoColor(r.tipo_richiesta)}`}
                        title={`${r.dipendenti?.nome} - ${r.tipo_richiesta}`}
                      >
                        {r.dipendenti?.nome.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* LEGENDA */}
        <div className="mt-6 flex gap-6 justify-center">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                <span className="h-3 w-3 rounded bg-green-100 border border-green-200"></span> Ferie
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                <span className="h-3 w-3 rounded bg-red-100 border border-red-200"></span> Malattia
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                <span className="h-3 w-3 rounded bg-blue-100 border border-blue-200"></span> Permessi
            </div>
        </div>
      </div>
    </main>
  )
}