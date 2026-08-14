import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Plus, ShieldCheck, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { saveUser, updateMemberRole } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'

export function SettingsPage() {
  const { appUser, home, tasks, signOut } = useApp()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(appUser?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const isGestor = home?.members?.[appUser?.uid]?.role === 'gestor'
  const members = Object.entries(home?.members ?? {})

  async function handleSaveName() {
    if (!name.trim()) return
    setSaving(true)
    await saveUser({ uid: appUser.uid, name: name.trim() })
    setEditName(false)
    setSaving(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(home?.inviteCode ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  async function toggleRole(uid, currentRole) {
    await updateMemberRole(home.id, uid, currentRole === 'gestor' ? 'miembro' : 'gestor')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Profile */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-3">Perfil</p>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={appUser?.photoUrl} name={appUser?.name} size={48} />
            <div>
              <p className="font-semibold text-gray-900">{appUser?.name}</p>
              <p className="text-xs text-gray-400">{appUser?.email}</p>
            </div>
          </div>

          {editName ? (
            <div className="flex flex-col gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
              <div className="flex gap-2">
                <Button onClick={handleSaveName} disabled={saving} className="flex-1">
                  {saving ? '...' : 'Guardar'}
                </Button>
                <Button onClick={() => setEditName(false)} variant="ghost" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setEditName(true)} variant="secondary" className="w-full">
              Editar nombre
            </Button>
          )}
        </Card>

        {/* Home */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-3">{home?.name}</p>

          <div className="flex flex-col gap-2 mb-4">
            {members.map(([uid, m]) => (
              <div key={uid} className="flex items-center gap-3">
                <Avatar src={m.photoUrl} name={m.name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.name}{uid === appUser?.uid ? ' (tú)' : ''}
                  </p>
                </div>
                {isGestor && uid !== appUser?.uid ? (
                  <button
                    onClick={() => toggleRole(uid, m.role)}
                    className={`flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 ${m.role === 'gestor' ? 'text-wine-700 bg-wine-100' : 'text-gray-500 bg-gray-100'}`}
                  >
                    {m.role === 'gestor' ? <ShieldCheck size={13} /> : <Shield size={13} />}
                    {m.role === 'gestor' ? 'Gestor' : 'Miembro'}
                  </button>
                ) : (
                  <span className={`text-xs font-medium rounded-lg px-2 py-1 ${m.role === 'gestor' ? 'text-wine-700 bg-wine-100' : 'text-gray-500 bg-gray-100'}`}>
                    {m.role === 'gestor' ? 'Gestor' : 'Miembro'}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-xs text-gray-400">Código de invitación</p>
              <p className="font-bold tracking-widest text-gray-900">{home?.inviteCode}</p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-sm font-medium text-wine-800 bg-wine-100 rounded-xl px-3 py-1.5"
            >
              {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>
        </Card>

        {/* Tasks: any member can see the full list (read-only); only the
            gestor can add or edit them. */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">Tareas del hogar</p>
            {isGestor && (
              <button
                onClick={() => navigate('/add-task')}
                className="flex items-center gap-1 text-xs font-semibold text-wine-700 bg-wine-100 rounded-lg px-2.5 py-1.5"
              >
                <Plus size={14} /> Agregar
              </button>
            )}
          </div>

          {tasks.length > 0 ? (
            <div className="flex flex-col gap-1 mt-2">
              {tasks.map((t) => {
                const row = (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.assigneeName}</p>
                    </div>
                    <span className={`text-xs font-medium rounded-lg px-2 py-1 ${t.active ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                      {t.active ? 'Activa' : 'Pausada'}
                    </span>
                  </>
                )
                return isGestor ? (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/add-task/${t.id}`)}
                    className="flex items-center gap-3 py-2 text-left"
                  >
                    {row}
                  </button>
                ) : (
                  <div key={t.id} className="flex items-center gap-3 py-2">
                    {row}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Todavía no hay tareas creadas.</p>
          )}
        </Card>

        {/* Sign out */}
        <Button onClick={handleSignOut} variant="danger" className="w-full">
          Cerrar sesión
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
