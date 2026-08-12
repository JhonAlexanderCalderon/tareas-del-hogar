import { useEffect, useState } from 'react'
import { Inbox, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { watchRecentCompletions } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'

const HISTORY_LIMIT = 100

export function HistoryPage() {
  const { home, appUser } = useApp()
  const [completions, setCompletions] = useState([])

  useEffect(() => {
    if (!home?.id) return
    return watchRecentCompletions(home.id, HISTORY_LIMIT, setCompletions)
  }, [home?.id])

  const grouped = completions.reduce((acc, c) => {
    const d = c.completedAt?.toDate ? c.completedAt.toDate() : new Date(c.completedAt)
    const key = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <h2 className="text-lg font-semibold text-gray-900">Historial</h2>
        <p className="text-gray-400 text-sm mt-1">Tareas completadas por la familia</p>
      </div>

      <div className="px-4 py-4">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-4">
              <p className="text-xs text-gray-400 capitalize mb-2 px-1">{date}</p>
              <Card>
                {items.map((c, i) => {
                  const isOwn = c.completedBy === appUser?.uid
                  const byOther = c.completedBy !== c.assigneeId
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <CheckCircle2 size={22} className="text-wine-600 shrink-0" strokeWidth={2} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.taskTitle}</p>
                        <p className="text-xs text-gray-400">
                          {c.assigneeName}
                          {byOther ? ` · completada por ${isOwn ? 'ti' : c.completedByName}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </Card>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Inbox size={40} className="mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm">Todavía no hay tareas completadas</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
