import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, LogOut, Plus, Euro, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { clearTechnicianSession } from './technicianSession';

// Mock data pour le planning
const planningData = [
  {
    id: 1,
    day: 'Lundi 15 Mars',
    date: '15/03',
    interventions: [
      { 
        id: 1, 
        time: '08:00', 
        project: 'Installation Datacenter A', 
        location: 'Paris 15ème',
        type: 'installation'
      },
    ]
  },
  {
    id: 2,
    day: 'Mardi 16 Mars',
    date: '16/03',
    interventions: [
      { 
        id: 2, 
        time: '09:00', 
        project: 'Maintenance Serveur B', 
        location: 'Issy-les-Moulineaux',
        type: 'maintenance'
      },
    ]
  },
  {
    id: 3,
    day: 'Mercredi 17 Mars',
    date: '17/03',
    interventions: [
      { 
        id: 3, 
        time: '08:30', 
        project: 'Réparation urgente Système C', 
        location: 'Boulogne-Billancourt',
        type: 'urgent'
      },
    ]
  },
  {
    id: 4,
    day: 'Jeudi 18 Mars',
    date: '18/03',
    interventions: [
      { 
        id: 4, 
        time: '10:00', 
        project: 'Installation Réseau D', 
        location: 'Neuilly-sur-Seine',
        type: 'installation'
      },
    ]
  },
  {
    id: 5,
    day: 'Vendredi 19 Mars',
    date: '19/03',
    interventions: [
      { 
        id: 5, 
        time: '09:00', 
        project: 'Maintenance préventive E', 
        location: 'La Défense',
        type: 'maintenance'
      },
    ]
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'maintenance':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'installation':
      return 'bg-green-100 border-green-300 text-green-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'Urgent';
    case 'maintenance':
      return 'Maintenance';
    case 'installation':
      return 'Installation';
    default:
      return type;
  }
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearTechnicianSession();
    navigate('/technicien/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon Planning</h1>
            <p className="text-blue-100 mt-1">Semaine du 15 au 19 Mars</p>
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

      {/* Content */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {/* Boutons d'action */}
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

        {/* Liste du planning */}
        {planningData.map((day) => (
          <Card key={day.id} className="p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{day.day}</h3>
                </div>
              </div>
            </div>

            {/* Interventions du jour */}
            <div className="space-y-3 mt-4">
              {day.interventions.map((intervention) => (
                <div 
                  key={intervention.id}
                  className={`p-4 rounded-xl border-2 ${getTypeColor(intervention.type)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-bold text-xs uppercase px-3 py-1 bg-white rounded-full">
                      {getTypeBadge(intervention.type)}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      {intervention.time}
                    </div>
                  </div>
                  <h4 className="font-bold text-base mb-2">{intervention.project}</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{intervention.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}