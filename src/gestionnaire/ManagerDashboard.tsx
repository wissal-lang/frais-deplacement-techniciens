import { useEffect, useState } from 'react'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Users, Wrench, Clock, CheckCircle, AlertCircle, Euro } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

interface DashboardStats {
  techniciens: number
  interventions: number
  frais: number
  fraisEnAttente: number
  fraisValides: number
}

interface RecentIntervention {
  id: number
  titre: string
  statut: string | null
  dateDepart: string | null
  technicien?: string
}

interface RecentExpense {
  id: number
  typeFrais: string
  montant: number
  devise: string
  mission: string
  technicien: string
  statutValidation: string
}

interface DashboardData {
  stats: DashboardStats
  recentInterventions: RecentIntervention[]
  recentExpenses: RecentExpense[]
}

function getActivityIcon(statut: string | null) {
  if (!statut) return <Clock className="w-5 h-5 text-blue-600" />
  const s = statut.toUpperCase()
  if (s === 'TERMINEE') return <CheckCircle className="w-5 h-5 text-green-600" />
  if (s === 'EN_COURS') return <Clock className="w-5 h-5 text-blue-600" />
  return <AlertCircle className="w-5 h-5 text-orange-600" />
}

function statutLabel(statut: string | null): string {
  if (!statut) return 'planifiée'
  const s = statut.toUpperCase()
  if (s === 'TERMINEE') return 'a complété'
  if (s === 'EN_COURS') return 'a commencé'
  return 'a mis à jour'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function ManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getManagerToken()
    if (!token) return

    apiFetch<DashboardData>('/api/manager/dashboard', { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const stats = data?.stats

  const statCards = [
    {
      label: 'Techniciens',
      value: stats ? String(stats.techniciens) : '—',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      sub: 'enregistrés',
    },
    {
      label: 'Interventions',
      value: stats ? String(stats.interventions) : '—',
      icon: Wrench,
      color: 'bg-purple-100 text-purple-600',
      sub: 'au total',
    },
    {
      label: 'Frais en attente',
      value: stats ? String(stats.fraisEnAttente) : '—',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      sub: 'à valider',
    },
    {
      label: 'Frais validés',
      value: stats ? String(stats.fraisValides) : '—',
      icon: Euro,
      color: 'bg-green-100 text-green-600',
      sub: 'à payer',
    },
  ]

  return (
    <ManagerLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de l'activité</p>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-xs text-gray-500">{stat.sub}</p>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Activité récente</h2>
                {data?.recentInterventions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune intervention enregistrée.</p>
                ) : (
                  <div className="space-y-4">
                    {data?.recentInterventions.map((iv) => (
                      <div key={iv.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div className="mt-1">{getActivityIcon(iv.statut)}</div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {iv.technicien && (
                              <>
                                <span className="font-semibold">{iv.technicien}</span>{' '}
                                {statutLabel(iv.statut)}{' '}
                              </>
                            )}
                            <span className="font-semibold">{iv.titre}</span>
                          </p>
                          {iv.dateDepart && (
                            <p className="text-xs text-gray-500 mt-1">{formatDate(iv.dateDepart)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Dernières notes de frais</h2>
                {data?.recentExpenses.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune note de frais enregistrée.</p>
                ) : (
                  <div className="space-y-4">
                    {data?.recentExpenses.map((exp) => {
                      const statut = exp.statutValidation
                      const color =
                        statut === 'PAYEE'
                          ? 'bg-green-100 text-green-700'
                          : statut === 'VALIDEE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                      const label =
                        statut === 'PAYEE' ? 'Payé' : statut === 'VALIDEE' ? 'Validé' : 'En attente'
                      return (
                        <div
                          key={exp.id}
                          className="flex items-start justify-between pb-4 border-b last:border-b-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{exp.technicien}</p>
                            <p className="text-xs text-gray-600">{exp.mission || exp.typeFrais}</p>
                          </div>
                          <div className="text-right ml-4 flex flex-col items-end gap-1">
                            <p className="text-sm font-bold text-gray-900">
                              {exp.montant.toFixed(2)} {exp.devise}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                              {label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </ManagerLayout>
  )
}
