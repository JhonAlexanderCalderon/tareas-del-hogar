import { useNavigate } from 'react-router-dom'
import { ChevronLeft, BarChart3, Circle, PartyPopper } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { toggleTaskCompletion } from '../utils/taskActions'
import { todaysTasksFor, overdueTasksFor, todayISO, overdueLabel, completedKeysFrom } from '../utils/recurrence'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'

export function OverviewPage() {
  const { appUser, home, tasks, completions } = useApp()
  const navigate = useNavigate()

  const isGestor = home?.members?.[appUser?.uid]?.role === 'gestor'
  const today = todayISO()
  const completedKeys = completedKeysFrom(completions)

  const overdueAll = overdueTasksFor(tasks, null, completedKeys)
  const todayAll = todaysTasksFor(tasks, null, today).filter((t) => !completedKeys.has(`${t.id}_${today}`))

  function canToggle(task) {
    return isGestor || task.assigneeId === appUser?.uid
  }

  function toggle(task, date) {
    toggleTaskCompletion({ home, appUser, completedKeys, task, date })
  }

  function Row({ task, date, tone }) {
    const member = home?.members?.[task.assigneeId]
    const interactive = canToggle(task)
    const circleColor = interactive ? (tone === 'red' ? 'text-red-500' : 'text-green-500') : 'text-gray-300'
    const metaColor = tone === 'red' ? 'text-red-500' : 'text-gray-400'

    const content = (
      <>
        <Avatar src={member?.photoUrl} name={member?.name} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
          <p className={`text-xs truncate ${metaColor}`}>
            {member?.name ?? 'Sin asignar'}{tone === 'red' ? ` · ${overdueLabel(date)}` : ''}
          </p>
        </div>
        <Circle size={20} className={`${circleColor} shrink-0`} strokeWidth={2} />
      </>
    )

    return interactive ? (
      <button onClick={() => toggle(task, date)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {content}
      </button>
    ) : (
      <div className="w-full flex items-center gap-3 px-4 py-3">{content}</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Vista general</h1>
        </div>
        <button
          onClick={() => navigate('/stats')}
          className="flex items-center gap-1 text-xs font-semibold text-wine-700 bg-wine-100 rounded-lg px-2.5 py-1.5 shrink-0"
        >
          <BarChart3 size={14} /> Estadísticas
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-red-600 mb-2 px-1">Atrasadas</p>
          {overdueAll.length > 0 ? (
            <Card className="bg-red-50 border-red-200">
              {overdueAll.map(({ task, date }, i) => (
                <div key={`${task.id}_${date}`} className={i < overdueAll.length - 1 ? 'border-b border-red-100' : ''}>
                  <Row task={task} date={date} tone="red" />
                </div>
              ))}
            </Card>
          ) : (
            <p className="text-xs text-gray-400 px-1">Nadie tiene tareas atrasadas.</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-green-700 mb-2 px-1">Pendientes de hoy</p>
          {todayAll.length > 0 ? (
            <Card>
              {todayAll.map((task, i) => (
                <div key={task.id} className={i < todayAll.length - 1 ? 'border-b border-gray-50' : ''}>
                  <Row task={task} date={today} tone="green" />
                </div>
              ))}
            </Card>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <PartyPopper size={32} className="mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm">Todo el hogar está al día por hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
