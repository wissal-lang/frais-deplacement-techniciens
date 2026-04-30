import { useEffect, useMemo, useState } from 'react'
import { useDrag, useDrop, DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  ArrowRightLeft,
  MapPin,
  UserRound,
  Clock3,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

const DRAG_TYPE = 'planning-intervention'
const DEFAULT_START_TIME = '08:00'

interface ManagerTechnician {
  id: number
  nom: string
  prenom: string | null
  email: string
  actif: boolean
}

interface PlanningTechnician {
  id: number
  nom: string
  prenom: string | null
  email: string | null
}

interface PlanningIntervention {
  id: number
  technicienId: number
  titre: string
  description: string
  lieuDepart: string
  lieuArrivee: string
  dateDepart: string | null
  dateRetour: string | null
  distanceKm: number | null
  statut: string | null
  createdAt: string | null
  technicien: PlanningTechnician | null
}

interface DragItem {
  id: number
  sourceTechnicianId: number
  sourceDate: string | null
}

interface DayColumn {
  date: Date
  key: string
  label: string
}

interface InterventionFormState {
  technicienId: string
  titre: string
  description: string
  lieuDepart: string
  lieuArrivee: string
  dateDepart: string
  statut: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function getWeekStart(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + offset)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatWeekLabel(startDate: Date) {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 4)
  return `${startDate.getDate().toString().padStart(2, '0')} ${startDate.toLocaleDateString('fr-FR', { month: 'long' })} ${startDate.getFullYear()} au ${endDate.getDate().toString().padStart(2, '0')} ${endDate.toLocaleDateString('fr-FR', { month: 'long' })} ${endDate.getFullYear()}`
}

function buildWorkingDays(weekStart: Date): DayColumn[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    return {
      date,
      key: toDateKey(date),
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    }
  })
}

function normalizeInputDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toInputDateTimeString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mergeDateWithTime(targetDate: Date, sourceDate?: Date | null) {
  const merged = new Date(targetDate)
  merged.setHours(
    sourceDate ? sourceDate.getHours() : 8,
    sourceDate ? sourceDate.getMinutes() : 0,
    0,
    0,
  )
  return merged
}

function getProjectColor(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes('urgent') || normalized.includes('reparation') || normalized.includes('réparation')) {
    return 'border-red-300 bg-red-50 text-red-800'
  }
  if (normalized.includes('maintenance')) {
    return 'border-blue-300 bg-blue-50 text-blue-800'
  }
  if (normalized.includes('installation')) {
    return 'border-green-300 bg-green-50 text-green-800'
  }
  if (normalized.includes('audit')) {
    return 'border-purple-300 bg-purple-50 text-purple-800'
  }
  return 'border-gray-300 bg-gray-50 text-gray-800'
}

function interventionStartsOnDay(intervention: PlanningIntervention, dayKey: string) {
  if (!intervention.dateDepart) return false
  return toDateKey(new Date(intervention.dateDepart)) === dayKey
}

function isSameDay(dateA: string | null, dateB: Date) {
  if (!dateA) return false
  return toDateKey(new Date(dateA)) === toDateKey(dateB)
}

function InterventionCard({
  intervention,
  onEdit,
  onDelete,
}: {
  intervention: PlanningIntervention
  onEdit: (intervention: PlanningIntervention) => void
  onDelete: (intervention: PlanningIntervention) => void
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DRAG_TYPE,
      item: {
        id: intervention.id,
        sourceTechnicianId: intervention.technicienId,
        sourceDate: intervention.dateDepart,
      } satisfies DragItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [intervention],
  )

  const startDate = intervention.dateDepart ? new Date(intervention.dateDepart) : null

  return (
    <div
      ref={drag}
      className={`rounded-xl border p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${getProjectColor(
        intervention.titre,
      )} ${isDragging ? 'opacity-40 scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{intervention.titre}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-80">
            {startDate && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {intervention.lieuDepart} → {intervention.lieuArrivee}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(intervention)
            }}
            className="rounded-md p-1.5 transition hover:bg-black/5"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(intervention)
            }}
            className="rounded-md p-1.5 transition hover:bg-black/5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {intervention.description ? (
        <p className="mt-2 line-clamp-2 text-xs opacity-80">{intervention.description}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-xs font-medium">
        <span className="inline-flex items-center gap-1">
          <UserRound className="h-3.5 w-3.5" />
          {intervention.technicien
            ? `${intervention.technicien.nom}${intervention.technicien.prenom ? ` ${intervention.technicien.prenom}` : ''}`
            : 'Technicien'}
        </span>
        <span className="rounded-full border border-current px-2 py-0.5">
          {intervention.statut || 'PLANIFIEE'}
        </span>
      </div>
    </div>
  )
}

function DayCell({
  technician,
  day,
  interventions,
  onDropIntervention,
  onAdd,
  onEdit,
  onDelete,
}: {
  technician: ManagerTechnician
  day: DayColumn
  interventions: PlanningIntervention[]
  onDropIntervention: (interventionId: number, targetTechnicianId: number, targetDate: Date) => Promise<void>
  onAdd: (technicianId: number, date: Date) => void
  onEdit: (intervention: PlanningIntervention) => void
  onDelete: (intervention: PlanningIntervention) => void
}) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: DRAG_TYPE,
      drop: async (item) => {
        const sourceDate = item.sourceDate ? new Date(item.sourceDate) : null
        const targetDate = mergeDateWithTime(day.date, sourceDate)
        await onDropIntervention(item.id, technician.id, targetDate)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [day.date, technician.id, onDropIntervention],
  )

  const cellInterventions = interventions.filter((intervention) => interventionStartsOnDay(intervention, day.key))

  return (
    <td
      ref={drop}
      className={`align-top border border-gray-200 p-2 transition-colors ${
        isOver && canDrop ? 'bg-green-50' : 'bg-white'
      }`}
    >
      <div
        className="min-h-[140px] rounded-xl border border-dashed border-gray-300 p-2 transition hover:border-green-400 hover:bg-green-50"
        onClick={() => onAdd(technician.id, day.date)}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-700">{day.label}</p>
            <p className="text-[11px] text-gray-500">{day.key}</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-white p-1 shadow-sm transition hover:bg-gray-50"
            onClick={(event) => {
              event.stopPropagation()
              onAdd(technician.id, day.date)
            }}
          >
            <Plus className="h-4 w-4 text-green-600" />
          </button>
        </div>

        <div className="space-y-2">
          {cellInterventions.length > 0 ? (
            cellInterventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="flex min-h-[88px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-400">
              Glisser une intervention ici
            </div>
          )}
        </div>
      </div>
    </td>
  )
}

export default function ManagerPlanningDragDrop() {
  const [technicians, setTechnicians] = useState<ManagerTechnician[]>([])
  const [interventions, setInterventions] = useState<PlanningIntervention[]>([])
  const [weekStart, setWeekStart] = useState(() => toDateInputValue(getWeekStart(new Date())))
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInterventionId, setEditingInterventionId] = useState<number | null>(null)
  const [prefillDate, setPrefillDate] = useState<Date | null>(null)
  const [prefillTechnicianId, setPrefillTechnicianId] = useState<number | null>(null)

  const [form, setForm] = useState<InterventionFormState>({
    technicienId: '',
    titre: '',
    description: '',
    lieuDepart: '',
    lieuArrivee: '',
    dateDepart: '',
    statut: 'PLANIFIEE',
  })

  const token = getManagerToken()

  const weekStartDate = useMemo(() => parseDateInput(weekStart) ?? getWeekStart(new Date()), [weekStart])
  const weekDays = useMemo(() => buildWorkingDays(weekStartDate), [weekStartDate])

  const displayedTechnicians = useMemo(() => {
    if (technicianFilter === 'all') return technicians
    return technicians.filter((technician) => String(technician.id) === technicianFilter)
  }, [technicianFilter, technicians])

  const interventionsByDayAndTechnician = useMemo(() => {
    return weekDays.reduce<Record<string, PlanningIntervention[]>>((accumulator, day) => {
      for (const technician of displayedTechnicians) {
        accumulator[`${technician.id}-${day.key}`] = interventions.filter(
          (intervention) =>
            intervention.technicienId === technician.id &&
            interventionStartsOnDay(intervention, day.key),
        )
      }
      return accumulator
    }, {})
  }, [displayedTechnicians, interventions, weekDays])

  const loadPlanning = async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [technicianResponse, interventionResponse] = await Promise.all([
        apiFetch<{ users: ManagerTechnician[] }>('/api/users?role=TECHNICIEN&actif=true', { token }),
        apiFetch<{ interventions: PlanningIntervention[] }>(
          `/api/interventions?semaine=${encodeURIComponent(weekStart)}` +
            (technicianFilter !== 'all' ? `&technicien_id=${encodeURIComponent(technicianFilter)}` : '') +
            (statusFilter !== 'all' ? `&statut=${encodeURIComponent(statusFilter)}` : ''),
          { token },
        ),
      ])

      setTechnicians(technicianResponse.users)
      setInterventions(interventionResponse.interventions)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger le planning'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlanning()
  }, [weekStart, technicianFilter, statusFilter])

  const openCreateDialog = (technicianId: number, date: Date) => {
    setEditingInterventionId(null)
    setPrefillTechnicianId(technicianId)
    setPrefillDate(date)
    setForm({
      technicienId: String(technicianId),
      titre: '',
      description: '',
      lieuDepart: '',
      lieuArrivee: '',
      dateDepart: toInputDateTimeString(mergeDateWithTime(date)),
      statut: 'PLANIFIEE',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (intervention: PlanningIntervention) => {
    setEditingInterventionId(intervention.id)
    setPrefillTechnicianId(intervention.technicienId)
    setPrefillDate(intervention.dateDepart ? new Date(intervention.dateDepart) : null)
    setForm({
      technicienId: String(intervention.technicienId),
      titre: intervention.titre,
      description: intervention.description || '',
      lieuDepart: intervention.lieuDepart || '',
      lieuArrivee: intervention.lieuArrivee || '',
      dateDepart: intervention.dateDepart ? normalizeInputDateTime(intervention.dateDepart) : '',
      statut: intervention.statut || 'PLANIFIEE',
    })
    setDialogOpen(true)
  }

  const handleDropIntervention = async (
    interventionId: number,
    targetTechnicianId: number,
    targetDate: Date,
  ) => {
    if (!token) return

    setIsSaving(true)
    try {
      const current = interventions.find((item) => item.id === interventionId)
      const currentDate = current?.dateDepart ? new Date(current.dateDepart) : null
      const newDate = mergeDateWithTime(targetDate, currentDate)
      await apiFetch<{ success: boolean }>(`/api/interventions/${interventionId}`, {
        token,
        method: 'PUT',
        body: {
          technicien_id: targetTechnicianId,
          date_depart: newDate.toISOString(),
        },
      })
      toast.success('Intervention réaffectée')
      await loadPlanning()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Réaffectation impossible'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (intervention: PlanningIntervention) => {
    if (!token) return

    const confirmed = window.confirm(`Supprimer l'intervention "${intervention.titre}" ?`)
    if (!confirmed) return

    setIsSaving(true)
    try {
      await apiFetch<{ success: boolean }>(`/api/interventions/${intervention.id}`, {
        token,
        method: 'DELETE',
      })
      toast.success('Intervention supprimée')
      await loadPlanning()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suppression impossible'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!token) return

    const selectedTechnicianId = Number.parseInt(form.technicienId, 10)
    if (!Number.isFinite(selectedTechnicianId) || !form.titre.trim() || !form.lieuDepart.trim() || !form.lieuArrivee.trim() || !form.dateDepart) {
      toast.error('Merci de remplir les champs obligatoires')
      return
    }

    const parsedDate = new Date(form.dateDepart)
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('Date de départ invalide')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        technicien_id: selectedTechnicianId,
        titre: form.titre.trim(),
        description: form.description.trim(),
        lieu_depart: form.lieuDepart.trim(),
        lieu_arrivee: form.lieuArrivee.trim(),
        date_depart: parsedDate.toISOString(),
        statut: form.statut,
      }

      if (editingInterventionId) {
        await apiFetch(`/api/interventions/${editingInterventionId}`, {
          token,
          method: 'PUT',
          body: payload,
        })
        toast.success('Intervention mise à jour')
      } else {
        await apiFetch('/api/interventions', {
          token,
          method: 'POST',
          body: payload,
        })
        toast.success('Intervention créée')
      }

      setDialogOpen(false)
      setEditingInterventionId(null)
      setPrefillDate(null)
      setPrefillTechnicianId(null)
      await loadPlanning()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Enregistrement impossible'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const resetFilters = () => {
    setTechnicianFilter('all')
    setStatusFilter('all')
    setWeekStart(toDateInputValue(getWeekStart(new Date())))
  }

  return (
    <ManagerLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Planning avancé</h1>
              <p className="text-gray-600">
                Réaffecte les interventions, filtre par semaine et gère le planning directement en base.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWeekStart(toDateInputValue(new Date(weekStartDate.getTime() - 7 * 24 * 60 * 60 * 1000)))}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Semaine précédente
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWeekStart(toDateInputValue(new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)))}
              >
                Semaine suivante
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button type="button" onClick={() => openCreateDialog(displayedTechnicians[0]?.id || technicians[0]?.id || 0, weekDays[0]?.date || new Date())}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle intervention
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <Card className="p-4 lg:col-span-2">
              <Label htmlFor="planning-week">Semaine</Label>
              <Input
                id="planning-week"
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value || toDateInputValue(getWeekStart(new Date())))}
                className="mt-2"
              />
              <p className="mt-2 text-sm text-gray-500">{formatWeekLabel(weekStartDate)}</p>
            </Card>

            <Card className="p-4">
              <Label htmlFor="technician-filter">Technicien</Label>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger id="technician-filter" className="mt-2">
                  <SelectValue placeholder="Tous les techniciens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={String(technician.id)}>
                      {technician.nom}
                      {technician.prenom ? ` ${technician.prenom}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            <Card className="p-4">
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-2">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PLANIFIEE">Planifiée</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TERMINEE">Terminée</SelectItem>
                  <SelectItem value="ANNULEE">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vue hebdomadaire</h2>
                  <p className="text-sm text-gray-500">
                    {displayedTechnicians.length} technicien{displayedTechnicians.length > 1 ? 's' : ''} affiché
                    {displayedTechnicians.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={loadPlanning} disabled={isLoading || isSaving}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700">
                      Technicien
                    </th>
                    {weekDays.map((day) => (
                      <th key={day.key} className="border border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedTechnicians.length === 0 ? (
                    <tr>
                      <td colSpan={weekDays.length + 1} className="border border-gray-200 p-6 text-center text-gray-500">
                        {isLoading ? 'Chargement du planning...' : 'Aucun technicien trouvé'}
                      </td>
                    </tr>
                  ) : (
                    displayedTechnicians.map((technician) => (
                      <tr key={technician.id}>
                        <td className="sticky left-0 z-10 border border-gray-200 bg-gray-50 p-4 align-top">
                          <div className="min-w-[180px]">
                            <p className="font-semibold text-gray-900">
                              {technician.nom}
                              {technician.prenom ? ` ${technician.prenom}` : ''}
                            </p>
                            <p className="text-sm text-gray-500">{technician.email}</p>
                          </div>
                        </td>
                        {weekDays.map((day) => (
                          <DayCell
                            key={`${technician.id}-${day.key}`}
                            technician={technician}
                            day={day}
                            interventions={interventionsByDayAndTechnician[`${technician.id}-${day.key}`] || []}
                            onDropIntervention={handleDropIntervention}
                            onAdd={openCreateDialog}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                          />
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-100 border border-green-300" />
                <span className="text-sm text-gray-700">Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-100 border border-blue-300" />
                <span className="text-sm text-gray-700">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-100 border border-red-300" />
                <span className="text-sm text-gray-700">Urgent</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Glisser-déposer pour réaffecter</span>
              </div>
            </div>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInterventionId ? 'Modifier l’intervention' : 'Créer une intervention'}
                </DialogTitle>
                <DialogDescription>
                  {prefillTechnicianId && prefillDate
                    ? `Technicien sélectionné : ${technicians.find((technician) => technician.id === prefillTechnicianId)?.nom || '—'}`
                    : 'Planifie une nouvelle mission dans la semaine en cours'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tech-select">Technicien</Label>
                  <Select
                    value={form.technicienId}
                    onValueChange={(value) => setForm((current) => ({ ...current, technicienId: value }))}
                  >
                    <SelectTrigger id="tech-select">
                      <SelectValue placeholder="Choisir un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((technician) => (
                        <SelectItem key={technician.id} value={String(technician.id)}>
                          {technician.nom}
                          {technician.prenom ? ` ${technician.prenom}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-select">Statut</Label>
                  <Select
                    value={form.statut}
                    onValueChange={(value) => setForm((current) => ({ ...current, statut: value }))}
                  >
                    <SelectTrigger id="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANIFIEE">Planifiée</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="TERMINEE">Terminée</SelectItem>
                      <SelectItem value="ANNULEE">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={form.titre}
                    onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                    placeholder="Maintenance réseau, installation serveur..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure">Lieu de départ</Label>
                  <Input
                    id="departure"
                    value={form.lieuDepart}
                    onChange={(event) => setForm((current) => ({ ...current, lieuDepart: event.target.value }))}
                    placeholder="Rabat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival">Lieu d’arrivée</Label>
                  <Input
                    id="arrival"
                    value={form.lieuArrivee}
                    onChange={(event) => setForm((current) => ({ ...current, lieuArrivee: event.target.value }))}
                    placeholder="Casablanca"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-depart">Date et heure de départ</Label>
                  <Input
                    id="date-depart"
                    type="datetime-local"
                    value={form.dateDepart}
                    onChange={(event) => setForm((current) => ({ ...current, dateDepart: event.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Détails de l’intervention..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DndProvider>
    </ManagerLayout>
  )
}
