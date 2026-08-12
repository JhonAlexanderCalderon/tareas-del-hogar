import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { saveUser } from '../firebase/firestore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function OnboardingPage() {
  const { firebaseUser } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState(firebaseUser?.displayName ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await saveUser({ uid: firebaseUser.uid, name: name.trim() })
    navigate('/home-setup')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-wine-100 flex items-center justify-center text-2xl">
            👋
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Hola!</h1>
          <p className="text-gray-500 text-sm mt-1">Cuéntanos un poco sobre ti</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="¿Cómo te llamas?"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
          />

          <Button type="submit" disabled={loading || !name.trim()} className="w-full mt-2">
            {loading ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
