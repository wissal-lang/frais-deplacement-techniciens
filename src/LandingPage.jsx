import { useNavigate } from 'react-router-dom'
import { Wrench, Users } from 'lucide-react'
import { Button } from './ui/button'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-blue-900">
            Gestion des Interventions
          </h1>
          <p className="text-xl text-blue-700">
            Planifiez, suivez et validez vos interventions en toute simplicité
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <Wrench className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
              Espace Technicien
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Interface simplifiée pour consulter votre planning et saisir vos
              interventions
            </p>
            <Button
              onClick={() => navigate('/technicien/login')}
              className="h-14 w-full bg-blue-600 text-lg text-white hover:bg-blue-700"
            >
              Accéder
            </Button>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Users className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
              Espace Gestionnaire
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Tableau de bord complet pour gérer les ressources et valider les
              interventions
            </p>
            <Button
              onClick={() => navigate('/gestionnaire/login')}
              className="h-14 w-full bg-green-600 text-lg text-white hover:bg-green-700"
            >
              Accéder
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
