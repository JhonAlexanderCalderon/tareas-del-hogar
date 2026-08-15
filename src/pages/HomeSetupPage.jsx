import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { createHome, joinHome } from '../firebase/firestore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export function HomeSetupPage() {
  const { appUser } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('join')
  const [homeName, setHomeName] = useState('')
  const [code, setCode] = useState('')
  const [createdHome, setCreatedHome] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const h = await createHome({
        uid: appUser.uid,
        name: appUser.name,
        photoUrl: appUser.photoUrl,
        homeName: homeName.trim(),
      })
      setCreatedHome(h)
    } catch (err) {
      setError(`No se pudo crear el hogar (${err.code ?? err.message ?? 'error desconocido'}). Intenta de nuevo.`)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await joinHome({ inviteCode: code, uid: appUser.uid, name: appUser.name, photoUrl: appUser.photoUrl })
      navigate('/home')
    } catch (err) {
      if (err.message === 'CODE_NOT_FOUND') {
        setError('Código no válido. Verifica con quien te invitó.')
      } else if (err.message === 'HOME_FULL') {
        setError('Ese hogar ya alcanzó el máximo de integrantes.')
      } else if (err.code === 'permission-denied') {
        setError('No tienes permiso para unirte a este hogar. Puede que ya no esté disponible.')
      } else if (err.code === 'unavailable' || err.code === 'network-request-failed') {
        setError('No se pudo conectar. Verifica tu internet e intenta de nuevo.')
      } else {
        setError(`No se pudo unir al hogar (${err.code ?? err.message ?? 'error desconocido'}). Intenta de nuevo.`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (createdHome) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-wine-100 flex items-center justify-center">
            <Link2 size={26} color="#722F37" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Hogar creado!</h2>
          <p className="text-gray-500 text-sm mb-6">Comparte este código con el resto de la familia</p>
          <Card className="p-6 mb-6">
            <p className="text-4xl font-bold tracking-widest text-gray-900 mb-2">
              {createdHome.inviteCode}
            </p>
            <p className="text-xs text-gray-400">Código de invitación</p>
          </Card>
          <Button onClick={() => navigate('/home')} className="w-full">
            Ir al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="w-14 h-14 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-gray-900">Tu hogar</h1>
        </div>

        <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {t === 'create' ? 'Crear hogar' : 'Unirme'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input
              label="Nombre del hogar"
              value={homeName}
              onChange={e => setHomeName(e.target.value)}
              placeholder="Ej. Casa de la familia"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando...' : 'Crear hogar'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              label="Código de invitación"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              error={error}
            />
            <Button type="submit" disabled={loading || code.length < 6} className="w-full">
              {loading ? 'Buscando...' : 'Unirme'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
