import { useState } from 'react';
import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Calendar, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const technicians = ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Bernard'];
const projects = [
  'Installation Datacenter A',
  'Maintenance Serveur B',
  'Réparation urgente Système C',
  'Installation Réseau D',
  'Maintenance préventive E',
];

const days = ['Lundi 15', 'Mardi 16', 'Mercredi 17', 'Jeudi 18', 'Vendredi 19'];

type AssignmentCell = { project: string; time: string } | null;

type AssignmentsState = Record<
  (typeof technicians)[number],
  Record<(typeof days)[number], AssignmentCell>
>;

const initialAssignments: AssignmentsState = {
  'Jean Dupont': {
    'Lundi 15': { project: 'Installation Datacenter A', time: '08:00' },
    'Mardi 16': null,
    'Mercredi 17': null,
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Marie Martin': {
    'Lundi 15': null,
    'Mardi 16': { project: 'Maintenance Serveur B', time: '09:00' },
    'Mercredi 17': null,
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Pierre Durand': {
    'Lundi 15': null,
    'Mardi 16': null,
    'Mercredi 17': { project: 'Réparation urgente Système C', time: '08:30' },
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Sophie Bernard': {
    'Lundi 15': null,
    'Mardi 16': null,
    'Mercredi 17': null,
    'Jeudi 18': { project: 'Installation Réseau D', time: '10:00' },
    'Vendredi 19': null,
  },
};

export default function ManagerPlanning() {
  const [assignments, setAssignments] =
    useState<AssignmentsState>(initialAssignments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ tech: string; day: string } | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    project: '',
    time: '',
  });

  const handleCellClick = (tech: string, day: string) => {
    setSelectedCell({ tech, day });
    const existing = assignments[tech][day];
    if (existing) {
      setNewAssignment({
        project: existing.project,
        time: existing.time,
      });
    } else {
      setNewAssignment({ project: '', time: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedCell || !newAssignment.project || !newAssignment.time) {
      toast.error('Veuillez sélectionner un projet et une heure');
      return;
    }

    setAssignments({
      ...assignments,
      [selectedCell.tech]: {
        ...assignments[selectedCell.tech],
        [selectedCell.day]: newAssignment,
      },
    });

    toast.success('Affectation enregistrée');
    setIsDialogOpen(false);
    setNewAssignment({ project: '', time: '' });
  };

  const handleRemoveAssignment = () => {
    if (!selectedCell) return;

    setAssignments({
      ...assignments,
      [selectedCell.tech]: {
        ...assignments[selectedCell.tech],
        [selectedCell.day]: null,
      },
    });

    toast.success('Affectation supprimée');
    setIsDialogOpen(false);
  };

  const getProjectColor = (project: string) => {
    if (!project) return '';
    if (project.includes('urgent') || project.includes('Réparation')) {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    if (project.includes('Maintenance')) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    }
    if (project.includes('Installation')) {
      return 'bg-green-100 border-green-300 text-green-800';
    }
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planification</h1>
          <p className="text-gray-600">Assignez des projets aux techniciens pour la semaine</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Semaine du 15 au 19 Mars 2026</h2>
          </div>

          {/* Planning Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 bg-gray-50 text-left font-semibold text-gray-700 min-w-[150px]">
                    Technicien
                  </th>
                  {days.map((day) => (
                    <th key={day} className="border p-3 bg-gray-50 text-center font-semibold text-gray-700 min-w-[180px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech}>
                    <td className="border p-3 bg-gray-50 font-medium text-gray-900">
                      {tech}
                    </td>
                    {days.map((day) => {
                      const assignment = assignments[tech][day];
                      return (
                        <td 
                          key={day} 
                          className="border p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleCellClick(tech, day)}
                        >
                          {assignment ? (
                            <div className={`p-3 rounded-lg border-2 ${getProjectColor(assignment.project)}`}>
                              <p className="font-semibold text-sm mb-1">{assignment.project}</p>
                              <p className="text-xs opacity-80">{assignment.time}</p>
                            </div>
                          ) : (
                            <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 hover:border-green-400 hover:bg-green-50 transition-colors">
                              <Plus className="w-5 h-5 mx-auto" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Légende</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
                <span className="text-sm text-gray-700">Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
                <span className="text-sm text-gray-700">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
                <span className="text-sm text-gray-700">Urgent</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Dialog for assignment */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCell && assignments[selectedCell.tech][selectedCell.day] 
                  ? 'Modifier l\'affectation' 
                  : 'Nouvelle affectation'}
              </DialogTitle>
              <DialogDescription>
                {selectedCell && `${selectedCell.tech} - ${selectedCell.day}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="project">Projet</Label>
                <Select value={newAssignment.project} onValueChange={(value) => setNewAssignment({ ...newAssignment, project: value })}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Heure de début</Label>
                <Select value={newAssignment.time} onValueChange={(value) => setNewAssignment({ ...newAssignment, time: value })}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Sélectionner une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00'].map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAssignment} className="flex-1 bg-green-600 hover:bg-green-700">
                  Enregistrer
                </Button>
                {selectedCell && assignments[selectedCell.tech][selectedCell.day] && (
                  <Button 
                    onClick={handleRemoveAssignment} 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  );
}
