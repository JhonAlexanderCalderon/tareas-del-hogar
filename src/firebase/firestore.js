import {
  collection, doc, getDoc, setDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot,
  deleteDoc, deleteField, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── USERS ────────────────────────────────────────────────

export function saveUser(user) {
  return setDoc(doc(db, 'users', user.uid), user, { merge: true })
}

export function watchUser(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), (snap) =>
    cb(snap.exists() ? snap.data() : null)
  )
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// ─── HOMES ────────────────────────────────────────────────

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createHome({ uid, name, photoUrl, homeName }) {
  const ref = doc(collection(db, 'homes'))
  const home = {
    id: ref.id,
    name: homeName || 'Nuestro hogar',
    inviteCode: generateCode(),
    maxMembers: 6,
    members: {
      [uid]: { name, photoUrl: photoUrl ?? '', role: 'gestor', joinedAt: serverTimestamp() },
    },
    createdBy: uid,
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, home)
  await setDoc(doc(db, 'users', uid), { homeId: ref.id }, { merge: true })
  return home
}

// Rechaza con Error('CODE_NOT_FOUND') o Error('HOME_FULL') para que la
// pantalla que llama pueda mostrar el mensaje correcto.
export async function joinHome({ inviteCode, uid, name, photoUrl }) {
  const q = query(collection(db, 'homes'), where('inviteCode', '==', inviteCode.toUpperCase()))
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(q, async (snap) => {
      unsub()
      if (snap.empty) {
        reject(new Error('CODE_NOT_FOUND'))
        return
      }
      const docSnap = snap.docs[0]
      const home = docSnap.data()

      if (home.members && home.members[uid]) {
        resolve({ id: docSnap.id, ...home })
        return
      }
      if (Object.keys(home.members || {}).length >= (home.maxMembers || 6)) {
        reject(new Error('HOME_FULL'))
        return
      }

      try {
        await updateDoc(docSnap.ref, {
          [`members.${uid}`]: { name, photoUrl: photoUrl ?? '', role: 'miembro', joinedAt: serverTimestamp() },
        })
        await setDoc(doc(db, 'users', uid), { homeId: docSnap.id }, { merge: true })
        const updated = await getDoc(docSnap.ref)
        resolve({ id: updated.id, ...updated.data() })
      } catch (err) {
        reject(err)
      }
    }, reject)
  })
}

export function watchHome(homeId, cb) {
  return onSnapshot(doc(db, 'homes', homeId), (snap) =>
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  )
}

export function updateHome(homeId, fields) {
  return updateDoc(doc(db, 'homes', homeId), fields)
}

export function updateMemberRole(homeId, uid, role) {
  return updateDoc(doc(db, 'homes', homeId), { [`members.${uid}.role`]: role })
}

export async function leaveHome(homeId, uid) {
  await updateDoc(doc(db, 'homes', homeId), { [`members.${uid}`]: deleteField() })
  await setDoc(doc(db, 'users', uid), { homeId: null }, { merge: true })
}

// ─── TASKS (plantillas recurrentes) ───────────────────────

export function saveTask(homeId, task) {
  const id = task.id || doc(collection(db, 'homes', homeId, 'tasks')).id
  const ref = doc(db, 'homes', homeId, 'tasks', id)
  const data = { ...task, id, updatedAt: serverTimestamp() }
  if (!task.createdAt) data.createdAt = serverTimestamp()
  return setDoc(ref, data, { merge: true })
}

export function deleteTask(homeId, taskId) {
  return deleteDoc(doc(db, 'homes', homeId, 'tasks', taskId))
}

export function watchTasks(homeId, cb) {
  return onSnapshot(collection(db, 'homes', homeId, 'tasks'), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

// ─── COMPLETIONS ───────────────────────────────────────────
// ID determinístico `${taskId}_${date}`: marcar-completado es idempotente
// (dos dispositivos marcando la misma ocurrencia no duplican nada) y
// "¿está completada esta ocurrencia?" es una verificación O(1) contra el
// Set construido en el contexto, en vez de una query por tarea.

export function completeTask({ homeId, taskId, date, taskTitle, assigneeId, assigneeName, completedBy, completedByName }) {
  const id = `${taskId}_${date}`
  const ref = doc(db, 'homes', homeId, 'completions', id)
  return setDoc(ref, {
    id, taskId, homeId, date, taskTitle, assigneeId, assigneeName,
    completedBy, completedByName, completedAt: serverTimestamp(),
  })
}

export function uncompleteTask(homeId, taskId, date) {
  return deleteDoc(doc(db, 'homes', homeId, 'completions', `${taskId}_${date}`))
}

// Ventana acotada (hoy - N días) — alimenta tanto los checkmarks de "Hoy"
// como el cálculo de atrasadas en recurrence.js.
export function watchCompletionsSince(homeId, sinceISO, cb) {
  const q = query(
    collection(db, 'homes', homeId, 'completions'),
    where('date', '>=', sinceISO),
  )
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Log completo de actividad para la pantalla de Historial — consulta
// distinta a la de arriba a propósito (no acotada por fecha, sí por
// cantidad, ordenada por cuándo se completó de verdad).
export function watchRecentCompletions(homeId, limitN, cb) {
  const q = query(
    collection(db, 'homes', homeId, 'completions'),
    orderBy('completedAt', 'desc'),
    limit(limitN),
  )
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
