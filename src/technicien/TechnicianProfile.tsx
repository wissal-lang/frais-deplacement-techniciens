import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { apiFetch, ApiError } from '../lib/api'
import { getTechnicianToken } from './technicianSession'

export default function TechnicianProfile() {
  const navigate = useNavigate()
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ancien || !nouveau || !confirmation) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (nouveau.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (nouveau !== confirmation) {
      toast.error('La confirmation ne correspond pas au nouveau mot de passe')
      return
    }

    const token = getTechnicianToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

    setIsSubmitting(true)
    try {
      await apiFetch('/api/technicien/password', {
        method: 'PUT',
        token,
        body: {
          ancien_mot_de_passe: ancien,
          nouveau_mot_de_passe: nouveau,
        },
      })
      toast.success('Mot de passe mis à jour avec succès')
      setAncien('')
      setNouveau('')
      setConfirmation('')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Impossible de changer le mot de passe'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/technicien/dashboard')}
            className="p-2 hover:bg-blue-700 rounded-full"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-bold">Mon profil</h1>
          <div className="w-11" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        <Card className="p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            Changer mon mot de passe
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="ancien" className="text-base font-bold mb-2 block">
                Mot de passe actuel *
              </Label>
              <Input
                id="ancien"
                type="password"
                value={ancien}
                onChange={(e) => setAncien(e.target.value)}
                className="h-14 text-lg"
                autoComplete="current-password"
              />
            </div>

            <div>
              <Label htmlFor="nouveau" className="text-base font-bold mb-2 block">
                Nouveau mot de passe *
              </Label>
              <Input
                id="nouveau"
                type="password"
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                className="h-14 text-lg"
                autoComplete="new-password"
                placeholder="6 caractères minimum"
              />
            </div>

            <div>
              <Label htmlFor="confirmation" className="text-base font-bold mb-2 block">
                Confirmer le nouveau mot de passe *
              </Label>
              <Input
                id="confirmation"
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="h-14 text-lg"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <ShieldCheck className="w-6 h-6 mr-3" />
              {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
