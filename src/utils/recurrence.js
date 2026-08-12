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

export function todaysTasksFor(tasks, personUid, dateISO = todayISO()) {
  return tasks.filter((t) => t.assigneeId === personUid && isDueOn(t, dateISO))
}

export const OVERDUE_LOOKBACK_DAYS = 30

// completedKeys: Set<string> de "taskId_date", construido por quien llama
// a partir de un solo snapshot de `completions` ya observado (ver
// watchCompletionsSince en firebase/firestore.js).
export function overdueTasksFor(tasks, personUid, completedKeys, options = {}) {
  const { today = todayISO(), lookbackDays = OVERDUE_LOOKBACK_DAYS } = options
  const lookbackStart = addDays(today, -lookbackDays)
  const mine = tasks.filter((t) => t.assigneeId === personUid)
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
