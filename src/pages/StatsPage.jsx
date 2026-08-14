import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { complianceStats, completedKeysFrom, OVERDUE_LOOKBACK_DAYS } from '../utils/recurrence'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'

export function StatsPage() {
  const { home, tasks, completions } = useApp()
  const navigate = useNavigate()

  const stats = complianceStats(tasks, completedKeysFrom(completions))
  const members = Object.entries(home?.members ?? {})

  const withData = []
  const withoutData = []
  for (const [uid, m] of members) {
    const row = stats.find((s) => s.assigneeId === uid)
    if (row) withData.push({ uid, m, ...row })
    else withoutData.push({ uid, m })
  }
  withData.sort((a, b) => b.pct - a.pct)

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Cumplimiento</h1>
          <p className="text-gray-400 text-sm mt-0.5">Últimos {OVERDUE_LOOKBACK_DAYS} días</p>
        </div>
      </div>

      <div className="px-4 py-4">
        <Card className="p-5">
          <div className="flex flex-col gap-5">
            {withData.map(({ uid, m, pct, completedCount, dueCount }) => (
              <div key={uid}>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={m.photoUrl} name={m.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{completedCount} de {dueCount} completadas</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">{pct}%</p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-wine-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}

            {withoutData.map(({ uid, m }) => (
              <div key={uid} className="flex items-center gap-3">
                <Avatar src={m.photoUrl} name={m.name} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400">Sin tareas en los últimos {OVERDUE_LOOKBACK_DAYS} días</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
