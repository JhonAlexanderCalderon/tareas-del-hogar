import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { saveTask, deleteTask } from '../firebase/firestore'
import { todayISO } from '../utils/recurrence'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'

const RECURRENCE_TYPES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'interval', label: 'Cada N días' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'once', label: 'Una vez' },
]

// Mostrado Lunes -> Domingo (más natural), pero guarda el valor 0-6 que
// espera recurrence.js (0 = domingo, igual que Date#getUTCDay()).
const WEEKDAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
]

function ToggleButton({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} ${active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
    >
      {children}
    </button>
  )
}

export function AddTaskPage() {
  const { appUser, home, tasks } = useApp()
  const navigate = useNavigate()
  const { taskId } = useParams()

  const existingTask = useMemo(() => tasks.find((t) => t.id === taskId) ?? null, [tasks, taskId])
  const isEditing = Boolean(taskId)
  const isGestor = home?.members?.[appUser?.uid]?.role === 'gestor'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState(appUser?.uid ?? '')
  const [recurrenceType, setRecurrenceType] = useState('weekly')
  const [daysOfWeek, setDaysOfWeek] = useState([1])
  const [intervalDays, setIntervalDays] = useState('3')
  const [anchorDate, setAnchorDate] = useState(todayISO())
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [onceDate, setOnceDate] = useState(todayISO())
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  // Redirect no-gestores fuera de esta pantalla (además del gate en las
  // reglas de Firestore, que es la protección real).
  useEffect(() => {
    if (home && !isGestor) navigate('/home', { replace: true })
  }, [home, isGestor, navigate])

  // Precarga el formulario si estamos editando.
  useEffect(() => {
    if (!existingTask) return
    setTitle(existingTask.title ?? '')
    setDescription(existingTask.description ?? '')
    setAssigneeId(existingTask.assigneeId ?? '')
    setActive(existingTask.active ?? true)
    const r = existingTask.recurrence ?? {}
    setRecurrenceType(r.type ?? 'weekly')
    if (r.daysOfWeek) setDaysOfWeek(r.daysOfWeek)
    if (r.intervalDays) setIntervalDays(String(r.intervalDays))
    if (r.anchorDate) setAnchorDate(r.anchorDate)
    if (r.dayOfMonth) setDayOfMonth(String(r.dayOfMonth))
    if (r.date) setOnceDate(r.date)
  }, [existingTask])

  function toggleWeekday(value) {
    setDaysOfWeek((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    )
  }

  function buildRecurrence() {
    if (recurrenceType === 'weekly') return { type: 'weekly', daysOfWeek }
    if (recurrenceType === 'interval') {
      return { type: 'interval', intervalDays: Math.max(1, Number(intervalDays) || 1), anchorDate }
    }
    if (recurrenceType === 'monthly') {
      return { type: 'monthly', dayOfMonth: Math.min(31, Math.max(1, Number(dayOfMonth) || 1)) }
    }
    return { type: 'once', date: onceDate }
  }

  function isFormValid() {
    if (!title.trim() || !assigneeId) return false
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) return false
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isFormValid()) return
    setLoading(true)

    const assignee = home.members[assigneeId]
    const wasInactive = existingTask ? !existingTask.active : true
    const reactivating = active && wasInactive

    await saveTask(home.id, {
      id: existingTask?.id,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      assigneeName: assignee?.name ?? '',
      active,
      ...(reactivating ? { activatedAt: new Date() } : {}),
      recurrence: buildRecurrence(),
      createdBy: existingTask?.createdBy ?? appUser.uid,
      createdAt: existingTask?.createdAt,
    })
    navigate('/settings')
  }

  async function handleDelete() {
    if (!existingTask) return
    if (!confirm(`¿Borrar "${existingTask.title}"? Esto no se puede deshacer.`)) return
    setLoading(true)
    await deleteTask(home.id, existingTask.id)
    navigate('/settings')
  }

  const members = Object.entries(home?.members ?? {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{isEditing ? 'Editar tarea' : 'Nueva tarea'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 flex flex-col gap-5">
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Sacar la basura"
          required
        />

        <Input
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Contenedor gris, sale a la calle"
          maxLength={80}
        />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Asignar a</p>
          <div className="flex gap-3">
            {members.map(([uid, m]) => (
              <button
                key={uid}
                type="button"
                onClick={() => setAssigneeId(uid)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`rounded-full ${assigneeId === uid ? 'ring-2 ring-wine-500 ring-offset-2' : ''}`}>
                  <Avatar src={m.photoUrl} name={m.name} size={44} />
                </div>
                <span className="text-xs text-gray-600 max-w-[64px] truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Repetición</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RECURRENCE_TYPES.map((r) => (
              <ToggleButton
                key={r.value}
                active={recurrenceType === r.value}
                onClick={() => setRecurrenceType(r.value)}
                className="py-3 rounded-2xl text-sm font-medium"
              >
                {r.label}
              </ToggleButton>
            ))}
          </div>

          {recurrenceType === 'weekly' && (
            <div className="flex gap-1.5">
              {WEEKDAYS.map((d) => (
                <ToggleButton
                  key={d.value}
                  active={daysOfWeek.includes(d.value)}
                  onClick={() => toggleWeekday(d.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                >
                  {d.label}
                </ToggleButton>
              ))}
            </div>
          )}

          {recurrenceType === 'interval' && (
            <div className="flex flex-col gap-3">
              <Input
                label="Repetir cada (días)"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
              <Input
                label="A partir de"
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
              />
            </div>
          )}

          {recurrenceType === 'monthly' && (
            <Input
              label="Día del mes"
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
            />
          )}

          {recurrenceType === 'monthly' && Number(dayOfMonth) > 28 && (
            <p className="text-xs text-gray-400 mt-1">
              En meses más cortos, cae en el último día real del mes (ej. el 30 en abril).
            </p>
          )}

          {recurrenceType === 'once' && (
            <Input
              label="Fecha"
              type="date"
              value={onceDate}
              onChange={(e) => setOnceDate(e.target.value)}
            />
          )}
        </div>

        <label className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Tarea activa</span>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-5 h-5 accent-wine-600"
          />
        </label>

        <Button type="submit" disabled={loading || !isFormValid()} className="w-full mt-2">
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear tarea'}
        </Button>

        {isEditing && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={loading} className="w-full">
            <Trash2 size={16} /> Borrar tarea
          </Button>
        )}
      </form>
    </div>
  )
}
