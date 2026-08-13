import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { saveUser, getUser, watchUser, watchHome, watchTasks, watchCompletionsSince } from '../firebase/firestore'
import { todayISO, addDays, OVERDUE_LOOKBACK_DAYS } from '../utils/recurrence'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined) // undefined = loading
  const [appUser, setAppUser] = useState(null)
  const [home, setHome] = useState(null)
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser ?? null)
      if (!fbUser) { setAppUser(null); setHome(null) }
    })
  }, [])

  // Watch appUser doc
  useEffect(() => {
    if (!firebaseUser) return
    return watchUser(firebaseUser.uid, (u) => setAppUser(u))
  }, [firebaseUser])

  // Watch home doc
  useEffect(() => {
    if (!appUser?.homeId) { setHome(null); return }
    return watchHome(appUser.homeId, (h) => setHome(h))
  }, [appUser?.homeId])

  // Watch task templates
  useEffect(() => {
    if (!home?.id) { setTasks([]); return }
    return watchTasks(home.id, setTasks)
  }, [home?.id])

  // Watch completions within the overdue lookback window. Re-subscribes if
  // the computed window start changes (i.e. the app stays open across a
  // day rollover) so "atrasadas" stays correct without a manual refresh.
  const sinceISO = addDays(todayISO(), -OVERDUE_LOOKBACK_DAYS)
  useEffect(() => {
    if (!home?.id) { setCompletions([]); return }
    return watchCompletionsSince(home.id, sinceISO, setCompletions)
  }, [home?.id, sinceISO])

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const { uid, displayName, email, photoURL } = result.user
    const existing = await getUser(uid)
    await saveUser({
      uid, name: displayName ?? '', email, photoUrl: photoURL ?? '',
      ...(existing ? {} : { homeId: null }),
    })
  }

  async function signOut() {
    await fbSignOut(auth)
    setAppUser(null)
    setHome(null)
  }

  const loading = firebaseUser === undefined

  return (
    <Ctx.Provider value={{
      firebaseUser, appUser, home, tasks, completions, loading,
      signInWithGoogle, signOut,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}
