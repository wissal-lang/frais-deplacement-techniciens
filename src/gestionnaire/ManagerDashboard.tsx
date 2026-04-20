import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Users, Briefcase, Clock, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

// Mock data
const stats = [
  { 
    label: 'Techniciens actifs', 
    value: '12', 
    icon: Users, 
    color: 'bg-blue-100 text-blue-600',
    change: '+2 ce mois'
  },
  { 
    label: 'Projets en cours', 
    value: '28', 
    icon: Briefcase, 
    color: 'bg-green-100 text-green-600',
    change: '5 nouveaux'
  },
  { 
    label: 'Interventions cette semaine', 
    value: '47', 
    icon: Wrench, 
    color: 'bg-purple-100 text-purple-600',
    change: '85% complétées'
  },
  { 
    label: 'En attente de validation', 
    value: '8', 
    icon: Clock, 
    color: 'bg-orange-100 text-orange-600',
    change: 'Cette semaine'
  },
];

const recentActivity = [
  { 
    id: 1, 
    technician: 'Jean Dupont', 
    action: 'a complété', 
    project: 'Installation Datacenter A',
    time: 'Il y a 2h',
    type: 'success'
  },
  { 
    id: 2, 
    technician: 'Marie Martin', 
    action: 'a commencé', 
    project: 'Maintenance Serveur B',
    time: 'Il y a 3h',
    type: 'info'
  },
  { 
    id: 3, 
    technician: 'Pierre Durand', 
    action: 'a signalé un problème sur', 
    project: 'Réparation urgente Système C',
    time: 'Il y a 5h',
    type: 'warning'
  },
  { 
    id: 4, 
    technician: 'Sophie Bernard', 
    action: 'a complété', 
    project: 'Installation Réseau D',
    time: 'Hier à 16:30',
    type: 'success'
  },
];

const upcomingInterventions = [
  { 
    id: 1, 
    project: 'Maintenance préventive E', 
    technician: 'Jean Dupont',
    date: 'Lundi 15 Mars',
    time: '09:00',
    type: 'maintenance'
  },
  { 
    id: 2, 
    project: 'Installation Datacenter F', 
    technician: 'Marie Martin',
    date: 'Mardi 16 Mars',
    time: '08:00',
    type: 'installation'
  },
  { 
    id: 3, 
    project: 'Réparation urgente G', 
    technician: 'Pierre Durand',
    date: 'Mercredi 17 Mars',
    time: '10:00',
    type: 'urgent'
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'maintenance':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'installation':
      return 'bg-green-100 text-green-700 border-green-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-orange-600" />;
    default:
      return <Clock className="w-5 h-5 text-blue-600" />;
  }
};

export default function ManagerDashboard() {
  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de l'activité</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activité récente</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.technician}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-semibold">{activity.project}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Interventions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Interventions à venir</h2>
            <div className="space-y-4">
              {upcomingInterventions.map((intervention) => (
                <div key={intervention.id} className={`p-4 rounded-lg border-2 ${getTypeColor(intervention.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{intervention.project}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-white rounded">
                      {intervention.type === 'installation' ? 'Installation' : 
                       intervention.type === 'maintenance' ? 'Maintenance' : 'Urgent'}
                    </span>
                  </div>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Technicien:</span> {intervention.technician}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {intervention.date} à {intervention.time}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  );
}
