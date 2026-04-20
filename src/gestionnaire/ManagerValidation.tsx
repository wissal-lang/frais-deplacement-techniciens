import { useState } from 'react';
import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { CheckCircle, XCircle, Clock, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type ReportStatus = 'pending' | 'validated' | 'rejected';

interface Report {
  id: number;
  technician: string;
  date: string;
  project: string;
  workType: string;
  description: string;
  timeSpent: string;
  status: ReportStatus;
  rejectionReason?: string;
}

// Mock data des rapports en attente
const initialReports: Report[] = [
  {
    id: 1,
    technician: 'Jean Dupont',
    date: 'Lundi 15 Mars',
    project: 'Installation Datacenter A',
    workType: 'Installation',
    description: 'Installation des serveurs réussie. Câblage réseau effectué. Tests de connexion validés. Configuration de base terminée.',
    timeSpent: '6h30',
    status: 'pending',
  },
  {
    id: 2,
    technician: 'Marie Martin',
    date: 'Mardi 16 Mars',
    project: 'Maintenance Serveur B',
    workType: 'Maintenance',
    description: 'Maintenance préventive effectuée. Nettoyage des composants. Mise à jour du firmware. Vérification des logs système.',
    timeSpent: '4h00',
    status: 'pending',
  },
  {
    id: 3,
    technician: 'Pierre Durand',
    date: 'Mercredi 17 Mars',
    project: 'Réparation urgente Système C',
    workType: 'Urgent',
    description: 'Problème de carte mère identifié. Remplacement effectué. Tests de stabilité en cours. Besoin de commander une pièce supplémentaire.',
    timeSpent: '7h00',
    status: 'pending',
  },
  {
    id: 4,
    technician: 'Sophie Bernard',
    date: 'Jeudi 18 Mars',
    project: 'Installation Réseau D',
    workType: 'Installation',
    description: 'Installation du réseau terminée. Configuration des switchs. Câblage structuré réalisé. Documentation remise au client.',
    timeSpent: '5h30',
    status: 'pending',
  },
];

const getWorkTypeColor = (type: string) => {
  switch (type) {
    case 'Urgent':
      return 'bg-red-100 text-red-700';
    case 'Maintenance':
      return 'bg-blue-100 text-blue-700';
    case 'Installation':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function ManagerValidation() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const validatedCount = reports.filter(r => r.status === 'validated').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
    setRejectionReason('');
  };

  const handleValidate = (reportId: number) => {
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'validated' } : r
    ));
    toast.success('Rapport validé avec succès', {
      description: 'Le planning réel a été mis à jour.',
    });
    setIsDialogOpen(false);
  };

  const handleReject = (reportId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }
    setReports(reports.map(r =>
      r.id === reportId ? { ...r, status: 'rejected' as const, rejectionReason } : r,
    ));
    toast.success('Rapport rejeté', {
      description: 'Le technicien sera notifié pour correction.',
    });
    setIsDialogOpen(false);
  };

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation des rapports</h1>
          <p className="text-gray-600">Consultez et validez les saisies journalières des techniciens</p>
        </div>

        {/* Stats */}
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

        {/* Reports List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Rapports à valider</h2>
          
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id}
                className={`p-6 rounded-lg border-2 transition-all ${
                  report.status === 'validated' ? 'bg-green-50 border-green-200' :
                  report.status === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{report.project}</h3>
                      <Badge className={getWorkTypeColor(report.workType)}>
                        {report.workType}
                      </Badge>
                      {report.status === 'validated' && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validé
                        </Badge>
                      )}
                      {report.status === 'rejected' && (
                        <Badge className="bg-red-600 text-white">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejeté
                        </Badge>
                      )}
                      {report.status === 'pending' && (
                        <Badge className="bg-orange-500 text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{report.technician}</span>
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

                {report.status === 'pending' && (
                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <Button 
                      onClick={() => handleViewReport(report)}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Examiner
                    </Button>
                    <Button 
                      onClick={() => handleValidate(report.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Valider rapidement
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du rapport</DialogTitle>
              <DialogDescription>
                Examinez le rapport et validez ou demandez une modification
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Technicien</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.technician}</p>
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
                      <Badge className={getWorkTypeColor(selectedReport.workType)}>
                        {selectedReport.workType}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Temps passé</Label>
                    <p className="text-gray-900 mt-1">{selectedReport.timeSpent}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Description de l'intervention</Label>
                  <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">
                    {selectedReport.description}
                  </p>
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
                    onClick={() => handleReject(selectedReport.id)}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Demander modification
                  </Button>
                  <Button 
                    onClick={() => handleValidate(selectedReport.id)}
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
  );
}
