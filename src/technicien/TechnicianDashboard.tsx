import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, LogOut, Plus, Euro, FileText } from 'lucide-react'
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
  date: Date
  label: string
  interventions: Intervention[]
}

function getWeekDays(): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatWeekRange(days: Date[]): string {
  const first = days[0]
  const last = days[days.length - 1]
  const d1 = first.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const d2 = last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `Semaine du ${d1} au ${d2}`
}

function extractTime(iso: string | null): string {
  if (!iso) return '08:00'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function interventionType(titre: string): 'urgent' | 'maintenance' | 'installation' {
  const t = titre.toLowerCase()
  if (t.includes('urgent') || t.includes('réparation') || t.includes('reparation')) return 'urgent'
  if (t.includes('maintenance')) return 'maintenance'
  return 'installation'
}

const TYPE_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 border-red-300 text-red-800',
  maintenance: 'bg-blue-100 border-blue-300 text-blue-800',
  installation: 'bg-green-100 border-green-300 text-green-800',
}

const TYPE_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  maintenance: 'Maintenance',
  installation: 'Installation',
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const weekDays = useMemo(() => getWeekDays(), [])

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

        const byDate = new Map<string, Intervention[]>()
        for (const iv of interventions) {
          if (!iv.dateDepart) continue
          const key = new Date(iv.dateDepart).toISOString().slice(0, 10)
          if (!byDate.has(key)) byDate.set(key, [])
          byDate.get(key)!.push(iv)
        }

        setDayGroups(
          weekDays.map((date) => ({
            date,
            label: formatDayLabel(date),
            interventions: byDate.get(date.toISOString().slice(0, 10)) ?? [],
          })),
        )
      } catch {
        // keep empty state on error
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [weekDays])

  const handleLogout = () => {
    clearTechnicianSession()
    navigate('/technicien/login', { replace: true })
  }

  const activeDays = dayGroups.filter((d) => d.interventions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon Planning</h1>
            <p className="text-blue-100 mt-1">
              {userName ? `Bonjour, ${userName}` : formatWeekRange(weekDays)}
            </p>
            {userName && (
              <p className="text-blue-200 text-sm mt-0.5">{formatWeekRange(weekDays)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-3 bg-blue-700 rounded-full hover:bg-blue-800"
          >
            <LogOut className="w-6 h-6" />
          </button>
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
        ) : activeDays.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Aucune intervention prévue cette semaine.
          </Card>
        ) : (
          activeDays.map((day) => (
            <Card key={day.date.toISOString()} className="p-5 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 capitalize">{day.label}</h3>
              </div>

              <div className="space-y-3">
                {day.interventions.map((iv) => {
                  const type = interventionType(iv.titre)
                  return (
                    <div key={iv.id} className={`p-4 rounded-xl border-2 ${TYPE_COLOR[type]}`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-bold text-xs uppercase px-3 py-1 bg-white rounded-full">
                          {TYPE_LABEL[type]}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {extractTime(iv.dateDepart)}
                        </div>
                      </div>
                      <h4 className="font-bold text-base mb-2">{iv.titre}</h4>
                      {(iv.lieuArrivee || iv.lieuDepart) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{iv.lieuArrivee || iv.lieuDepart}</span>
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
