import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { CalendarRange, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';

const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const technicians = [
  {
    name: 'Jean Dupont',
    missions: [
      { start: 0, end: 2, project: 'Datacenter Alpha', color: 'bg-blue-500' },
      { start: 3, end: 5, project: 'Infrastructure Beta', color: 'bg-green-500' },
      { start: 7, end: 9, project: 'Migration Gamma', color: 'bg-purple-500' },
    ],
  },
  {
    name: 'Marie Martin',
    missions: [
      { start: 1, end: 3, project: 'Réseau Delta', color: 'bg-orange-500' },
      { start: 5, end: 7, project: 'Serveurs Epsilon', color: 'bg-pink-500' },
      { start: 9, end: 11, project: 'Cloud Zeta', color: 'bg-indigo-500' },
    ],
  },
  {
    name: 'Pierre Durand',
    missions: [
      { start: 0, end: 1, project: 'Support Urgent', color: 'bg-red-500' },
      { start: 2, end: 5, project: 'Maintenance Générale', color: 'bg-blue-500' },
      { start: 6, end: 8, project: 'Installation Kappa', color: 'bg-green-500' },
      { start: 10, end: 11, project: 'Audit Lambda', color: 'bg-yellow-600' },
    ],
  },
  {
    name: 'Sophie Bernard',
    missions: [
      { start: 1, end: 4, project: 'Formation Interne', color: 'bg-teal-500' },
      { start: 5, end: 6, project: 'Congés', color: 'bg-gray-400' },
      { start: 7, end: 10, project: 'Déploiement Omega', color: 'bg-purple-500' },
    ],
  },
];

export default function ManagerPlanningYear() {
  const [selectedYear, setSelectedYear] = useState('2026');

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Planning Annuel</h1>
              <p className="text-gray-600">Vue d'ensemble de la charge de travail sur l'année</p>
            </div>
            <div className="w-48">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">4</p>
                <p className="text-sm text-gray-600">Techniciens actifs</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CalendarRange className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">15</p>
                <p className="text-sm text-gray-600">Missions planifiées</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalendarRange className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">87%</p>
                <p className="text-sm text-gray-600">Taux d'occupation</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gantt Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CalendarRange className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Diagramme de Gantt - Année {selectedYear}</h2>
          </div>

          <div className="overflow-x-auto">
            {/* Timeline Header */}
            <div className="mb-4">
              <div className="flex">
                <div className="w-48 flex-shrink-0"></div>
                <div className="flex-1 flex">
                  {months.map((month) => (
                    <div key={month} className="flex-1 text-center">
                      <div className="px-2 py-2 bg-gray-100 border-r border-gray-300 font-semibold text-sm text-gray-700">
                        {month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="space-y-3">
              {technicians.map((tech) => (
                <div key={tech.name} className="flex items-stretch">
                  {/* Technicien Name */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="h-full flex items-center">
                      <div className="font-medium text-gray-900">{tech.name}</div>
                    </div>
                  </div>

                  {/* Timeline Grid */}
                  <div className="flex-1 relative">
                    {/* Grid Background */}
                    <div className="absolute inset-0 flex">
                      {months.map((month) => (
                        <div
                          key={`bg-${month}`}
                          className="flex-1 border-r border-gray-200 bg-gray-50"
                        ></div>
                      ))}
                    </div>

                    {/* Mission Bars */}
                    <div className="relative h-16 flex items-center">
                      {tech.missions.map((mission, index) => {
                        const width = ((mission.end - mission.start + 1) / 12) * 100;
                        const left = (mission.start / 12) * 100;

                        return (
                          <div
                            key={index}
                            className={`absolute ${mission.color} text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer group`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              height: '48px',
                            }}
                          >
                            <div className="flex items-center justify-between h-full">
                              <span className="text-xs font-semibold truncate">
                                {mission.project}
                              </span>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                              {mission.project} ({months[mission.start]} - {months[mission.end]})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Légende */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4">Légende des projets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700">Migration/Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Support Urgent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Réseau</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span className="text-sm text-gray-700">Serveurs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-teal-500 rounded"></div>
                <span className="text-sm text-gray-700">Formation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-700">Congés</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Survolez les barres pour voir les détails de chaque mission. Cette vue vous permet d'identifier rapidement les périodes de forte charge et les disponibilités.
            </p>
          </div>
        </Card>
      </div>
    </ManagerLayout>
  );
}
