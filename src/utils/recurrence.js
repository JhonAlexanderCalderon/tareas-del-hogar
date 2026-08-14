// Todas las fechas son strings 'YYYY-MM-DD'. La aritmética de fechas usa
// Date.UTC(...) para evitar corrimientos de un día por DST — la única
// excepción es todayISO(), que sí lee la hora local (porque "hoy" es
// inherentemente local).

export function todayISO(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isoFromUTCDate(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dayOfWeek(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + n)
  return isoFromUTCDate(date)
}

export function daysBetween(fromISO, toISO) {
  const [fy, fm, fd] = fromISO.split('-').map(Number)
  const [ty, tm, td] = toISO.split('-').map(Number)
  const fromMs = Date.UTC(fy, fm - 1, fd)
  const toMs = Date.UTC(ty, tm - 1, td)
  return Math.round((toMs - fromMs) / 86400000)
}

export function lastDayOfMonth(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}

export function clampDayOfMonth(dayOfMonth, year, monthIndex0) {
  return Math.min(dayOfMonth, lastDayOfMonth(year, monthIndex0))
}

function toDateSafe(value) {
  if (!value) return null
  return typeof value.toDate === 'function' ? value.toDate() : new Date(value)
}

// Regla de mes: día 31 en un mes de 30 días (o el 29/30/31 en febrero) cae
// en el último día real de ese mes, no se salta el mes ni rueda al 1ro del
// siguiente.
export function isDueOn(task, dateISO) {
  if (!task.active) return false
  const r = task.recurrence
  switch (r.type) {
    case 'once':
      return r.date === dateISO
    case 'weekly':
      return r.daysOfWeek.includes(dayOfWeek(dateISO))
    case 'interval': {
      if (dateISO < r.anchorDate) return false
      return daysBetween(r.anchorDate, dateISO) % r.intervalDays === 0
    }
    case 'monthly': {
      const [y, m, d] = dateISO.split('-').map(Number)
      return d === clampDayOfMonth(r.dayOfMonth, y, m - 1)
    }
    default:
      return false
  }
}

// personUid === null (estrictamente, no undefined) significa "todas las
// personas" — se usa comparación estricta para que un appUser?.uid
// transitoriamente undefined durante la carga siga filtrando a nada, en
// vez de filtrar a "todos" por accidente.
export function todaysTasksFor(tasks, personUid, dateISO = todayISO()) {
  return tasks.filter((t) => (personUid === null || t.assigneeId === personUid) && isDueOn(t, dateISO))
}

export const OVERDUE_LOOKBACK_DAYS = 30

// completedKeys: Set<string> de "taskId_date", construido por quien llama
// a partir de un solo snapshot de `completions` ya observado (ver
// watchCompletionsSince en firebase/firestore.js).
export function overdueTasksFor(tasks, personUid, completedKeys, options = {}) {
  const { today = todayISO(), lookbackDays = OVERDUE_LOOKBACK_DAYS } = options
  const lookbackStart = addDays(today, -lookbackDays)
  const mine = tasks.filter((t) => personUid === null || t.assigneeId === personUid)
  const result = []

  for (const task of mine) {
    // Evita resucitar atraso de antes de que la tarea se (re)activara.
    const activatedDate = toDateSafe(task.activatedAt)
    const floor = activatedDate ? todayISO(activatedDate) : null

    let cursor = addDays(today, -1) // arranca en ayer, "hoy" nunca es atraso
    while (cursor >= lookbackStart) {
      if (floor && cursor < floor) break
      if (isDueOn(task, cursor) && !completedKeys.has(`${task.id}_${cursor}`)) {
        result.push({ task, date: cursor })
      }
      cursor = addDays(cursor, -1)
    }
  }

  return result.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export function overdueLabel(date) {
  const diff = daysBetween(date, todayISO())
  if (diff === 1) return 'Ayer'
  return `Hace ${diff} días`
}

export function completedKeysFrom(completions) {
  return new Set(completions.map((c) => `${c.taskId}_${c.date}`))
}

function formatDateEs(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Días lunes -> domingo, para leer siempre en orden natural sin importar
// el orden en que se guardaron (daysOfWeek se guarda ascendente 0-6, que
// arranca en domingo si está seleccionado).
const WEEKDAY_LABELS = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' }
const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function recurrenceText(recurrence) {
  const r = recurrence ?? {}
  switch (r.type) {
    case 'weekly': {
      const days = WEEKDAY_DISPLAY_ORDER.filter((d) => r.daysOfWeek?.includes(d)).map((d) => WEEKDAY_LABELS[d])
      return days.length ? days.join(', ') : 'Sin días seleccionados'
    }
    case 'interval':
      return `Cada ${r.intervalDays} día${r.intervalDays === 1 ? '' : 's'} desde ${formatDateEs(r.anchorDate)}`
    case 'monthly':
      return `Día ${r.dayOfMonth} de cada mes`
    case 'once':
      return `Una vez el ${formatDateEs(r.date)}`
    default:
      return ''
  }
}

// Igual que overdueTasksFor pero cuenta TODAS las ocurrencias vencidas (no
// solo las incumplidas) agrupadas por asignado, para calcular % de
// cumplimiento. Hereda a propósito el mismo comportamiento de
// overdueTasksFor: pausar una tarea (active: false) le pone en cero todo
// su historial de la ventana, no solo desde la fecha de pausa, porque
// isDueOn mira el estado actual de `active`, no el histórico.
export function complianceStats(tasks, completedKeys, options = {}) {
  const { today = todayISO(), lookbackDays = OVERDUE_LOOKBACK_DAYS } = options
  const lookbackStart = addDays(today, -lookbackDays)
  const byAssignee = new Map()

  for (const task of tasks) {
    const activatedDate = toDateSafe(task.activatedAt)
    const floor = activatedDate ? todayISO(activatedDate) : null

    let cursor = addDays(today, -1) // hoy nunca cuenta, igual que overdueTasksFor
    while (cursor >= lookbackStart) {
      if (floor && cursor < floor) break
      if (isDueOn(task, cursor)) {
        const entry = byAssignee.get(task.assigneeId) ?? { due: 0, completed: 0 }
        entry.due += 1
        if (completedKeys.has(`${task.id}_${cursor}`)) entry.completed += 1
        byAssignee.set(task.assigneeId, entry)
      }
      cursor = addDays(cursor, -1)
    }
  }

  return Array.from(byAssignee, ([assigneeId, { due, completed }]) => ({
    assigneeId,
    dueCount: due,
    completedCount: completed,
    pct: due > 0 ? Math.round((completed / due) * 100) : 0,
  }))
}
