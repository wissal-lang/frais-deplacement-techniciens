import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Euro, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { apiFetch } from '../lib/api'
import { getTechnicianToken } from './technicianSession'

type ExpenseStatus = 'pending' | 'validated' | 'accountingValidated' | 'reimbursed'

interface ApiExpense {
  id: number
  interventionId: number | null
  typeFrais: string
  montant: number
  devise: string
  dateFrais: string | null
  description: string
  statutValidation: string
  mission: string
  createdAt: string | null
}

interface ExpenseRow {
  id: number
  project: string
  amount: number
  date: string
  status: ExpenseStatus
  currentStep: number
}

function mapStatus(statut: string): { status: ExpenseStatus; step: number } {
  switch (statut) {
    case 'VALIDEE':
      return { status: 'accountingValidated', step: 3 }
    case 'PAYEE':
      return { status: 'reimbursed', step: 4 }
    default:
      return { status: 'pending', step: 1 }
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const getStatusBadge = (status: ExpenseStatus) => {
  switch (status) {
    case 'pending':
      return { label: 'En attente manager', color: 'bg-orange-100 text-orange-700' }
    case 'validated':
      return { label: 'Validé - En attente compta', color: 'bg-blue-100 text-blue-700' }
    case 'accountingValidated':
      return { label: 'Validé - En attente paiement', color: 'bg-purple-100 text-purple-700' }
    case 'reimbursed':
      return { label: 'Remboursé ✓', color: 'bg-green-100 text-green-700' }
  }
}

const steps = [
  { id: 1, label: 'Saisie', icon: Clock },
  { id: 2, label: 'Manager', icon: CheckCircle },
  { id: 3, label: 'Compta', icon: AlertCircle },
  { id: 4, label: 'Virement', icon: Euro },
] as const

export default function TechnicianExpenses() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [reimbursedTotal, setReimbursedTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getTechnicianToken()
    if (!token) return

    apiFetch<ApiExpense[]>('/api/technicien/frais', { token })
      .then((data) => {
        const rows: ExpenseRow[] = data.map((e) => {
          const { status, step } = mapStatus(e.statutValidation)
          return {
            id: e.id,
            project: e.mission || e.typeFrais,
            amount: e.montant,
            date: formatDate(e.dateFrais),
            status,
            currentStep: step,
          }
        })
        setExpenses(rows)
        setPendingTotal(
          data.filter((e) => e.statutValidation === 'EN_ATTENTE').reduce((s, e) => s + e.montant, 0),
        )
        setReimbursedTotal(
          data.filter((e) => e.statutValidation === 'PAYEE').reduce((s, e) => s + e.montant, 0),
        )
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-8">
      <div className="bg-orange-600 p-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/technicien/dashboard')}
            className="rounded-full p-2 hover:bg-orange-700"
            aria-label="Retour au planning"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <h1 className="text-2xl font-bold">Suivi Financier</h1>
          <div className="w-11" />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md space-y-4 px-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-100 to-orange-50 p-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="mb-1 text-3xl font-bold text-orange-800">{pendingTotal.toFixed(2)} MAD</p>
            <p className="text-sm font-medium text-orange-700">Total en attente</p>
          </Card>

          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-100 to-green-50 p-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="mb-1 text-3xl font-bold text-green-800">{reimbursedTotal.toFixed(2)} MAD</p>
            <p className="text-sm font-medium text-green-700">Remboursé</p>
          </Card>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Mes demandes</h2>

          {isLoading ? (
            <Card className="p-6 text-center text-gray-500">Chargement...</Card>
          ) : expenses.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">Aucune note de frais enregistrée.</Card>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const badge = getStatusBadge(expense.status)
                return (
                  <Card key={expense.id} className="p-5 shadow-md transition-shadow hover:shadow-lg">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-gray-900">{expense.project}</h3>
                        <p className="text-sm text-gray-600 capitalize">{expense.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {expense.amount.toFixed(2)} MAD
                        </p>
                      </div>
                    </div>

                    <Badge className={`${badge.color} mb-4`}>{badge.label}</Badge>

                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                          const Icon = step.icon
                          const isActive = step.id === expense.currentStep
                          const isCompleted = step.id < expense.currentStep

                          return (
                            <div key={step.id} className="flex flex-1 items-center">
                              <div className="flex flex-1 flex-col items-center">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                                    isCompleted
                                      ? 'bg-green-500'
                                      : isActive
                                        ? 'bg-blue-500 ring-4 ring-blue-200'
                                        : 'bg-gray-300'
                                  }`}
                                >
                                  <Icon
                                    className={`h-5 w-5 ${
                                      isCompleted || isActive ? 'text-white' : 'text-gray-500'
                                    }`}
                                  />
                                </div>
                                <p
                                  className={`mt-1 text-xs font-medium ${
                                    isActive
                                      ? 'text-blue-700'
                                      : isCompleted
                                        ? 'text-green-700'
                                        : 'text-gray-500'
                                  }`}
                                >
                                  {step.label}
                                </p>
                              </div>
                              {index < steps.length - 1 && (
                                <div
                                  className={`h-1 flex-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
