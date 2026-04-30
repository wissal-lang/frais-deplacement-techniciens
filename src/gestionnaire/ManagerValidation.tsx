import { useEffect, useMemo, useState } from 'react'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { CheckCircle, XCircle, Clock, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

type ReportStatus = 'EN_ATTENTE' | 'VALIDE' | 'REJETE'

interface Report {
  id: number
  technicien: string
  date: string
  project: string
  workType: string
  description: string
  timeSpent: string
  status: ReportStatus
  rejectionReason?: string | null
}

interface ApiReport {
  id: number
  date: string | null
  tempsPasse: string | null
  notes: string | null
  statut: string
  commentaireValidation?: string | null
  intervention: {
    id: number
    titre: string
    description?: string
  } | null
  technicien: {
    id: number
    nom: string
    prenom: string | null
    email: string
  } | null
}

const getWorkTypeColor = (type: string) => {
  switch (type) {
    case 'Urgent':
      return 'bg-red-100 text-red-700'
    case 'Maintenance':
      return 'bg-blue-100 text-blue-700'
    case 'Installation':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function mapStatus(status: string): ReportStatus {
  const normalized = status.toUpperCase()
  if (normalized === 'VALIDE' || normalized === 'VALIDATED') return 'VALIDE'
  if (normalized === 'REJETE' || normalized === 'REJECTED') return 'REJETE'
  return 'EN_ATTENTE'
}

function mapWorkType(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes('urgent')) return 'Urgent'
  if (normalized.includes('maintenance')) return 'Maintenance'
  return 'Installation'
}

export default function ManagerValidation() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadReports = async () => {
    const token = getManagerToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const data = await apiFetch<{ rapports: ApiReport[] }>('/api/rapports', { token })
      setReports(
        data.rapports.map((report) => ({
          id: report.id,
          technicien:
            [report.technicien?.nom, report.technicien?.prenom].filter(Boolean).join(' ') ||
            report.technicien?.email ||
            'Technicien',
          date: report.date ? new Date(report.date).toLocaleDateString('fr-FR') : 'N/A',
          project: report.intervention?.titre || 'Intervention',
          workType: mapWorkType(report.intervention?.titre || ''),
          description: report.notes || report.intervention?.description || 'Aucune description',
          timeSpent: report.tempsPasse || '-',
          status: mapStatus(report.statut),
          rejectionReason: report.commentaireValidation || null,
        })),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger les rapports'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const pendingCount = useMemo(() => reports.filter((report) => report.status === 'EN_ATTENTE').length, [reports])
  const validatedCount = useMemo(() => reports.filter((report) => report.status === 'VALIDE').length, [reports])
  const rejectedCount = useMemo(() => reports.filter((report) => report.status === 'REJETE').length, [reports])

  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setIsDialogOpen(true)
    setRejectionReason(report.rejectionReason || '')
  }

  const updateReportStatus = async (reportId: number, decision: 'VALIDE' | 'REJETE') => {
    const token = getManagerToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

    try {
      const response = await apiFetch<{ rapport: ApiReport }>(`/api/rapports/${reportId}/valider`, {
        method: 'PUT',
        token,
        body: {
          decision,
          commentaire: decision === 'REJETE' ? rejectionReason : null,
        },
      })

      const updated = response.rapport
      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: mapStatus(updated.statut),
                rejectionReason: updated.commentaireValidation || null,
              }
            : report,
        ),
      )

      toast.success(decision === 'VALIDE' ? 'Rapport validé avec succès' : 'Rapport rejeté')
      setIsDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de mettre à jour le rapport'
      toast.error(message)
    }
  }

  return (
    <ManagerLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation des rapports</h1>
          <p className="text-gray-600">Consultez et validez les saisies journalières des techniciens</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{validatedCount}</p>
                <p className="text-sm text-gray-600">Validés</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{rejectedCount}</p>
                <p className="text-sm text-gray-600">Rejetés</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Rapports à valider</h2>

          {isLoading ? (
            <p className="py-10 text-center text-gray-600">Chargement des rapports...</p>
          ) : (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-center text-gray-600 py-10">Aucun rapport en attente.</p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      report.status === 'VALIDE'
                        ? 'bg-green-50 border-green-200'
                        : report.status === 'REJETE'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{report.project}</h3>
                          <Badge className={getWorkTypeColor(report.workType)}>{report.workType}</Badge>
                          {report.status === 'VALIDE' && <Badge className="bg-green-600 text-white">Validé</Badge>}
                          {report.status === 'REJETE' && <Badge className="bg-red-600 text-white">Rejeté</Badge>}
                          {report.status === 'EN_ATTENTE' && <Badge className="bg-orange-500 text-white">En attente</Badge>}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{report.technicien}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {report.timeSpent}
                          </span>
                        </div>
                        <p className="text-gray-700">{report.description}</p>
                      </div>
                    </div>

                    {report.status === 'EN_ATTENTE' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t">
                        <Button onClick={() => handleViewReport(report)} variant="outline" className="flex-1">
                          <FileText className="w-4 h-4 mr-2" />
                          Examiner
                        </Button>
                        <Button
                          onClick={() => updateReportStatus(report.id, 'VALIDE')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider rapidement
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du rapport</DialogTitle>
              <DialogDescription>Examinez le rapport et validez ou demandez une modification</DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Technicien</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.technicien}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Date</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.date}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Projet</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.project}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Type de travail</Label>
                    <p className="text-gray-900 mt-1">
                      <Badge className={getWorkTypeColor(selectedReport.workType)}>{selectedReport.workType}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Temps passé</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.timeSpent}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Description de l'intervention</Label>
                  <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">{selectedReport.description}</p>
                </div>

                <div>
                  <Label htmlFor="rejection-reason" className="text-sm font-semibold text-gray-700">
                    Raison du rejet (optionnel)
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Indiquez les corrections nécessaires..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => updateReportStatus(selectedReport.id, 'REJETE')}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Demander modification
                  </Button>
                  <Button
                    onClick={() => updateReportStatus(selectedReport.id, 'VALIDE')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider le rapport
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  )
}
