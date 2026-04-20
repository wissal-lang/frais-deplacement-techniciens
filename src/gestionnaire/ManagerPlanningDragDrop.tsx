import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Calendar, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const technicians = ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Bernard'];
const days = ['Lundi 15', 'Mardi 16', 'Mercredi 17', 'Jeudi 18', 'Vendredi 19'];

interface Assignment {
  project: string;
  time: string;
  type: 'installation' | 'maintenance' | 'urgent';
}

interface Assignments {
  [tech: string]: {
    [day: string]: Assignment | null;
  };
}

const initialAssignments: Assignments = {
  'Jean Dupont': {
    'Lundi 15': { project: 'Installation Datacenter A', time: '08:00', type: 'installation' },
    'Mardi 16': null,
    'Mercredi 17': null,
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Marie Martin': {
    'Lundi 15': null,
    'Mardi 16': { project: 'Maintenance Serveur B', time: '09:00', type: 'maintenance' },
    'Mercredi 17': null,
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Pierre Durand': {
    'Lundi 15': null,
    'Mardi 16': null,
    'Mercredi 17': { project: 'Réparation urgente Système C', time: '08:30', type: 'urgent' },
    'Jeudi 18': null,
    'Vendredi 19': null,
  },
  'Sophie Bernard': {
    'Lundi 15': null,
    'Mardi 16': null,
    'Mercredi 17': null,
    'Jeudi 18': { project: 'Installation Réseau D', time: '10:00', type: 'installation' },
    'Vendredi 19': null,
  },
};

const getProjectColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'bg-red-100 border-red-400 text-red-800';
    case 'maintenance':
      return 'bg-blue-100 border-blue-400 text-blue-800';
    case 'installation':
      return 'bg-green-100 border-green-400 text-green-800';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-800';
  }
};

interface DraggableCardProps {
  assignment: Assignment;
  tech: string;
  day: string;
}

const DraggableCard = ({ assignment, tech, day }: DraggableCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'assignment',
    item: { assignment, sourceTech: tech, sourceDay: day },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={(node) => {
        drag(node);
      }}
      className={`p-3 rounded-lg border-2 cursor-move ${getProjectColor(assignment.type)} transition-all hover:shadow-md ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 flex-shrink-0 mt-1 opacity-50" />
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">{assignment.project}</p>
          <p className="text-xs opacity-80">{assignment.time}</p>
        </div>
      </div>
    </div>
  );
};

interface DragItem {
  assignment: Assignment;
  sourceTech: string;
  sourceDay: string;
}

interface DroppableCellProps {
  tech: string;
  day: string;
  assignment: Assignment | null;
  onDrop: (item: DragItem, tech: string, day: string) => void;
}

const DroppableCell = ({ tech, day, assignment, onDrop }: DroppableCellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'assignment',
    drop: (item: DragItem) => onDrop(item, tech, day),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <td
      ref={(node) => {
        drop(node);
      }}
      className={`border p-2 transition-colors ${
        isOver ? 'bg-green-100 border-green-400' : 'hover:bg-gray-50'
      }`}
    >
      {assignment ? (
        <DraggableCard assignment={assignment} tech={tech} day={day} />
      ) : (
        <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 min-h-[60px] flex items-center justify-center">
          <span className="text-xs">Glissez ici</span>
        </div>
      )}
    </td>
  );
};

function PlanningContent() {
  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);

  const handleDrop = (item: DragItem, targetTech: string, targetDay: string) => {
    const { sourceTech, sourceDay, assignment } = item;

    // Ne rien faire si on dépose au même endroit
    if (sourceTech === targetTech && sourceDay === targetDay) {
      return;
    }

    // Mise à jour des affectations
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      
      // Retirer de l'ancienne position
      newAssignments[sourceTech] = {
        ...newAssignments[sourceTech],
        [sourceDay]: null,
      };
      
      // Ajouter à la nouvelle position
      newAssignments[targetTech] = {
        ...newAssignments[targetTech],
        [targetDay]: assignment,
      };
      
      return newAssignments;
    });

    toast.success('Intervention déplacée !', {
      description: `${assignment.project} → ${targetTech} (${targetDay})`,
    });
  };

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planning Interactif</h1>
          <p className="text-gray-600">Glissez-déposez les interventions pour réorganiser le planning</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Semaine du 15 au 19 Mars 2026</h2>
          </div>

          {/* Info Drag & Drop */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Cliquez et glissez les blocs colorés pour réaffecter une intervention à un autre technicien ou à un autre jour.
            </p>
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
                    <th key={day} className="border p-3 bg-gray-50 text-center font-semibold text-gray-700 min-w-[200px]">
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
                    {days.map((day) => (
                      <DroppableCell
                        key={day}
                        tech={tech}
                        day={day}
                        assignment={assignments[tech][day]}
                        onDrop={handleDrop}
                      />
                    ))}
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
                <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded"></div>
                <span className="text-sm text-gray-700">Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-400 rounded"></div>
                <span className="text-sm text-gray-700">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border-2 border-red-400 rounded"></div>
                <span className="text-sm text-gray-700">Urgent</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ManagerLayout>
  );
}

export default function ManagerPlanningDragDrop() {
  return (
    <DndProvider backend={HTML5Backend}>
      <PlanningContent />
    </DndProvider>
  );
}
