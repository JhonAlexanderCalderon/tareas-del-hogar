import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { recurrenceText } from '../utils/recurrence'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'

export function TeamTasksPage() {
  const { appUser, home, tasks } = useApp()
  const navigate = useNavigate()

  const isGestor = home?.members?.[appUser?.uid]?.role === 'gestor'
  const members = Object.entries(home?.members ?? {})

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <h1 className="text-lg font-semibold text-gray-900">Tareas</h1>
        <p className="text-gray-400 text-sm mt-1">Qué hace cada quien en la casa</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {members.map(([uid, m]) => {
          const memberTasks = tasks.filter((t) => t.assigneeId === uid)
          return (
            <div key={uid}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Avatar src={m.photoUrl} name={m.name} size={24} />
                <p className="text-sm font-semibold text-gray-700">{m.name}</p>
              </div>
              <Card className="p-5">
                {memberTasks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {memberTasks.map((t, i) => {
                      const content = (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{t.title}</p>
                            <span className={`text-xs font-medium rounded-lg px-2 py-1 shrink-0 ${t.active ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                              {t.active ? 'Activa' : 'Pausada'}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{recurrenceText(t.recurrence)}</p>
                        </>
                      )
                      return isGestor ? (
                        <button
                          key={t.id}
                          onClick={() => navigate(`/add-task/${t.id}`)}
                          className={`text-left ${i < memberTasks.length - 1 ? 'pb-3 border-b border-gray-50' : ''}`}
                        >
                          {content}
                        </button>
                      ) : (
                        <div key={t.id} className={i < memberTasks.length - 1 ? 'pb-3 border-b border-gray-50' : ''}>
                          {content}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin tareas asignadas todavía.</p>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
