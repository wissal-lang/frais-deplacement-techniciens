import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, LogOut, Plus, Euro, FileText, CheckCircle, AlertCircle, PlayCircle, KeyRound } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { clearTechnicianSession, getTechnicianToken } from './technicianSession'
import { apiFetch } from '../lib/api'

interface Intervention {
  id: number
  titre: string
  lieuDepart: string | null
  lieuArrivee: string | null
  dateDepart: string | null
  statut: string | null
}

interface DayGroup {
  dateKey: string
  label: string
  interventions: Intervention[]
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function extractTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getStatutBadge(statut: string | null) {
  switch ((statut ?? '').toUpperCase()) {
    case 'TERMINEE':
    case 'TERMINE':
      return {
        label: 'Terminée',
        icon: <CheckCircle className="w-4 h-4" />,
        className: 'bg-green-100 border-green-300 text-green-800',
        badgeClass: 'bg-green-600 text-white',
      }
    case 'EN_COURS':
      return {
        label: 'En cours',
        icon: <PlayCircle className="w-4 h-4" />,
        className: 'bg-blue-100 border-blue-300 text-blue-800',
        badgeClass: 'bg-blue-600 text-white',
      }
    case 'URGENT':
      return {
        label: 'Urgent',
        icon: <AlertCircle className="w-4 h-4" />,
        className: 'bg-red-100 border-red-300 text-red-800',
        badgeClass: 'bg-red-600 text-white',
      }
    default:
      // PLANIFIEE or anything else
      return {
        label: 'Planifiée',
        icon: <Calendar className="w-4 h-4" />,
        className: 'bg-orange-50 border-orange-200 text-orange-800',
        badgeClass: 'bg-orange-500 text-white',
      }
  }
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getTechnicianToken()
    if (!token) return

    const load = async () => {
      try {
        const [meData, interventions] = await Promise.all([
          apiFetch<{ user: { nom: string; prenom: string | null } }>('/api/technicien/me', { token }),
          apiFetch<Intervention[]>('/api/technicien/interventions', { token }),
        ])

        const u = meData.user
        setUserName([u.nom, u.prenom].filter(Boolean).join(' '))

        // Group ALL interventions by date — no week filter
        const byDate = new Map<string, Intervention[]>()
        for (const iv of interventions) {
          const key = iv.dateDepart
            ? new Date(iv.dateDepart).toISOString().slice(0, 10)
            : 'sans-date'
          if (!byDate.has(key)) byDate.set(key, [])
          byDate.get(key)!.push(iv)
        }

        // Sort keys chronologically (most recent first)
        const sortedKeys = Array.from(byDate.keys()).sort((a, b) => {
          if (a === 'sans-date') return 1
          if (b === 'sans-date') return -1
          return b.localeCompare(a) // descending
        })

        setDayGroups(
          sortedKeys.map((key) => ({
            dateKey: key,
            label: key === 'sans-date'
              ? 'Date non précisée'
              : formatDayLabel(new Date(key + 'T00:00:00')),
            interventions: byDate.get(key)!,
          })),
        )
      } catch {
        // keep empty state on error
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleLogout = () => {
    clearTechnicianSession()
    navigate('/technicien/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon Planning</h1>
            <p className="text-blue-100 mt-1">
              {userName ? `Bonjour, ${userName}` : 'Chargement...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/technicien/profil')}
              className="p-3 bg-blue-700 rounded-full hover:bg-blue-800"
              title="Mon profil / mot de passe"
            >
              <KeyRound className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-3 bg-blue-700 rounded-full hover:bg-blue-800"
              title="Déconnexion"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => navigate('/technicien/saisie')}
            className="h-20 text-lg bg-green-600 hover:bg-green-700 shadow-lg flex-col gap-2"
          >
            <Plus className="w-8 h-8" />
            <span>Saisie Journalière</span>
          </Button>

          <Button
            type="button"
            onClick={() => navigate('/technicien/frais')}
            className="h-20 text-lg bg-orange-600 hover:bg-orange-700 shadow-lg flex-col gap-2"
          >
            <Euro className="w-8 h-8" />
            <span>Mes Frais</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            type="button"
            onClick={() => navigate('/technicien/demande-frais')}
            className="h-20 text-lg bg-purple-600 hover:bg-purple-700 shadow-lg flex-col gap-2"
          >
            <FileText className="w-8 h-8" />
            <span>Demande de Frais</span>
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-6 text-center text-gray-500">Chargement du planning...</Card>
        ) : dayGroups.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Aucune intervention assignée pour le moment.
          </Card>
        ) : (
          dayGroups.map((day) => (
            <Card key={day.dateKey} className="p-5 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 capitalize">{day.label}</h3>
              </div>

              <div className="space-y-3">
                {day.interventions.map((iv) => {
                  const badge = getStatutBadge(iv.statut)
                  return (
                    <div key={iv.id} className={`p-4 rounded-xl border-2 ${badge.className}`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className={`flex items-center gap-1 font-bold text-xs uppercase px-3 py-1 rounded-full ${badge.badgeClass}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {extractTime(iv.dateDepart)}
                        </div>
                      </div>
                      <h4 className="font-bold text-base mb-2">{iv.titre}</h4>
                      {(iv.lieuDepart || iv.lieuArrivee) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {iv.lieuDepart && iv.lieuArrivee
                              ? `${iv.lieuDepart} → ${iv.lieuArrivee}`
                              : iv.lieuArrivee || iv.lieuDepart}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
