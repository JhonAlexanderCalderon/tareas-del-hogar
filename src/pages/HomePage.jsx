import { useState } from 'react'
import { CheckCircle2, Circle, AlertTriangle, PartyPopper } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { toggleTaskCompletion } from '../utils/taskActions'
import { todaysTasksFor, overdueTasksFor, todayISO, addDays, overdueLabel, completedKeysFrom } from '../utils/recurrence'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'

const DAY_TABS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'manana', label: 'Mañana' },
]

export function HomePage() {
  const { appUser, home, tasks, completions } = useApp()
  const [dayTab, setDayTab] = useState('hoy')

  const today = todayISO()
  const tomorrow = addDays(today, 1)
  const completedKeys = completedKeysFrom(completions)
  const todaysTasks = todaysTasksFor(tasks, appUser?.uid, today)
  const tomorrowsTasks = todaysTasksFor(tasks, appUser?.uid, tomorrow)
  const overdue = overdueTasksFor(tasks, appUser?.uid, completedKeys)

  function toggle(task, date) {
    toggleTaskCompletion({ home, appUser, completedKeys, task, date })
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
            <Card className="bg-red-50 border-red-200">
              {overdue.map(({ task, date }, i) => (
                <button
                  key={`${task.id}_${date}`}
                  onClick={() => toggle(task, date)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${i < overdue.length - 1 ? 'border-b border-red-100' : ''}`}
                >
                  <Circle size={22} className="text-red-500 shrink-0" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-red-500">{overdueLabel(date)}</p>
                  </div>
                </button>
              ))}
            </Card>
          </div>
        )}

        <div className="flex rounded-2xl bg-gray-100 p-1">
          {DAY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setDayTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${dayTab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dayTab === 'hoy' ? (
          todaysTasks.length > 0 ? (
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
                      <CheckCircle2 size={22} className="text-green-600 shrink-0" strokeWidth={2} />
                    ) : (
                      <Circle size={22} className="text-green-400 shrink-0" strokeWidth={2} />
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
          )
        ) : tomorrowsTasks.length > 0 ? (
          <Card>
            {tomorrowsTasks.map((task, i) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < tomorrowsTasks.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-400 truncate">{task.description}</p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No tienes tareas para mañana</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
