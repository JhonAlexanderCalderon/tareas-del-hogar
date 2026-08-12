import { CheckCircle2, Circle, AlertTriangle, PartyPopper } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { completeTask, uncompleteTask } from '../firebase/firestore'
import { todaysTasksFor, overdueTasksFor, todayISO, daysBetween } from '../utils/recurrence'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'

function overdueLabel(date) {
  const diff = daysBetween(date, todayISO())
  if (diff === 1) return 'Ayer'
  return `Hace ${diff} días`
}

export function HomePage() {
  const { appUser, home, tasks, completions } = useApp()

  const today = todayISO()
  const completedKeys = new Set(completions.map((c) => `${c.taskId}_${c.date}`))
  const todaysTasks = todaysTasksFor(tasks, appUser?.uid, today)
  const overdue = overdueTasksFor(tasks, appUser?.uid, completedKeys)

  function toggle(task, date) {
    const key = `${task.id}_${date}`
    if (completedKeys.has(key)) {
      uncompleteTask(home.id, task.id, date)
      return
    }
    completeTask({
      homeId: home.id,
      taskId: task.id,
      date,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      completedBy: appUser.uid,
      completedByName: appUser.name,
    })
  }

  const greeting = appUser?.name ? `Hola, ${appUser.name.split(' ')[0]}` : 'Hola'
  const todayLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <p className="text-gray-400 text-sm">{greeting}</p>
        <h2 className="text-lg font-semibold text-gray-900 capitalize mt-1">{todayLabel}</h2>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {overdue.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-red-600 mb-2 px-1 flex items-center gap-1">
              <AlertTriangle size={15} /> Atrasadas
            </p>
            <Card className="border-red-100">
              {overdue.map(({ task, date }, i) => (
                <button
                  key={`${task.id}_${date}`}
                  onClick={() => toggle(task, date)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${i < overdue.length - 1 ? 'border-b border-red-50' : ''}`}
                >
                  <Circle size={22} className="text-red-400 shrink-0" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-red-500">{overdueLabel(date)}</p>
                  </div>
                </button>
              ))}
            </Card>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Hoy</p>
          {todaysTasks.length > 0 ? (
            <Card>
              {todaysTasks.map((task, i) => {
                const done = completedKeys.has(`${task.id}_${today}`)
                return (
                  <button
                    key={task.id}
                    onClick={() => toggle(task, today)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${i < todaysTasks.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    {done ? (
                      <CheckCircle2 size={22} className="text-wine-600 shrink-0" strokeWidth={2} />
                    ) : (
                      <Circle size={22} className="text-gray-300 shrink-0" strokeWidth={2} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-400 truncate">{task.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </Card>
          ) : (
            overdue.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <PartyPopper size={40} className="mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm">¡Todo al día! No tienes tareas pendientes</p>
              </div>
            )
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
