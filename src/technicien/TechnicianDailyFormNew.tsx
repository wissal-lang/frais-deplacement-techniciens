import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, CheckCircle, MapPin, Wrench, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Mock: Mission du jour
const todayMission = {
  project: 'Installation Datacenter A',
  location: 'Paris 15ème',
  time: '08:00',
  client: 'Entreprise Alpha',
};

const materials = [
  'Serveurs Dell PowerEdge',
  'Câbles réseau Cat6',
  'Switch Cisco 48 ports',
  'Onduleur APC',
  'Rack 42U',
  'Autre matériel',
];

const timeOptions = [
  '0h30', '1h00', '1h30', '2h00', '2h30', '3h00', 
  '3h30', '4h00', '4h30', '5h00', '5h30', '6h00',
  '6h30', '7h00', '7h30', '8h00'
];

export default function TechnicianDailyFormNew() {
  const navigate = useNavigate();

  const [missionConfirmed, setMissionConfirmed] = useState(false);
  const [gpsLocation, setGpsLocation] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [installationComplete, setInstallationComplete] = useState(false);
  const [clientPresent, setClientPresent] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);
  const [timeSpent, setTimeSpent] = useState('');
  const [notes, setNotes] = useState('');

  // Simuler la géolocalisation
  const handleConfirmPresence = () => {
    setMissionConfirmed(true);
    // Simulation GPS
    setTimeout(() => {
      setGpsLocation('Paris 15ème, Rue de Vaugirard');
      toast.success('Position GPS acquise !');
    }, 500);
  };

  const handleMaterialToggle = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const handleSubmit = () => {
    if (!missionConfirmed || selectedMaterials.length === 0 || !timeSpent) {
      toast.error('Veuillez compléter tous les champs obligatoires');
      return;
    }
    
    toast.success('✅ Journée validée avec succès !', {
      description: 'Votre intervention a été enregistrée.',
      duration: 3000,
    });
    
    setTimeout(() => {
      navigate('/technicien/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/technicien/dashboard')}
            className="p-2 hover:bg-blue-700 rounded-full"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-bold">Saisie Journalière</h1>
          <div className="w-11" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {/* Mission du jour */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mission du jour</h2>
            <p className="text-2xl font-bold text-green-700 mb-2">{todayMission.project}</p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>📍 {todayMission.location}</p>
              <p>🕐 {todayMission.time}</p>
              <p>👤 {todayMission.client}</p>
            </div>
          </div>
          
          {!missionConfirmed ? (
            <Button 
              onClick={handleConfirmPresence}
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Confirmer ma présence
            </Button>
          ) : (
            <div className="bg-green-600 text-white p-4 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold">Présence confirmée ✓</p>
            </div>
          )}
        </Card>

        {/* GPS Location */}
        {missionConfirmed && (
          <Card className="p-5 bg-blue-50 border-2 border-blue-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">Position GPS acquise</p>
                <p className="text-lg font-bold text-blue-700">{gpsLocation}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Matériel utilisé */}
        {missionConfirmed && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Matériel utilisé</h3>
            <p className="text-sm text-gray-600 mb-4">Sélectionnez un ou plusieurs matériels</p>
            <div className="space-y-3">
              {materials.map((mat) => (
                <div
                  key={mat}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => handleMaterialToggle(mat)}
                >
                  <Checkbox
                    id={`material-${mat}`}
                    checked={selectedMaterials.includes(mat)}
                    onCheckedChange={() => handleMaterialToggle(mat)}
                    className="w-6 h-6"
                  />
                  <label htmlFor={`material-${mat}`} className="flex-1 cursor-pointer">
                    <p className="text-lg font-semibold text-gray-900">{mat}</p>
                  </label>
                </div>
              ))}
            </div>
            {selectedMaterials.length > 0 && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">
                  {selectedMaterials.length} matériel{selectedMaterials.length > 1 ? 's' : ''} sélectionné{selectedMaterials.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Checkboxes - Étapes */}
        {missionConfirmed && selectedMaterials.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">✓ Étapes de l'intervention</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Checkbox
                  id="installation"
                  checked={installationComplete}
                  onCheckedChange={(checked) => setInstallationComplete(checked as boolean)}
                  className="mt-1 w-6 h-6"
                />
                <label htmlFor="installation" className="flex-1 cursor-pointer">
                  <p className="text-lg font-semibold text-gray-900">Installation terminée ?</p>
                  <p className="text-sm text-gray-600">Tous les équipements sont installés</p>
                </label>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Checkbox
                  id="client"
                  checked={clientPresent}
                  onCheckedChange={(checked) => setClientPresent(checked as boolean)}
                  className="mt-1 w-6 h-6"
                />
                <label htmlFor="client" className="flex-1 cursor-pointer">
                  <p className="text-lg font-semibold text-gray-900">Client présent ?</p>
                  <p className="text-sm text-gray-600">Le client était sur place</p>
                </label>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Checkbox
                  id="tests"
                  checked={testsPassed}
                  onCheckedChange={(checked) => setTestsPassed(checked as boolean)}
                  className="mt-1 w-6 h-6"
                />
                <label htmlFor="tests" className="flex-1 cursor-pointer">
                  <p className="text-lg font-semibold text-gray-900">Tests validés ?</p>
                  <p className="text-sm text-gray-600">Tous les tests sont passés</p>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Temps passé */}
        {missionConfirmed && selectedMaterials.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              <Clock className="w-5 h-5 inline mr-2" />
              Temps passé
            </h3>
            <Select value={timeSpent} onValueChange={setTimeSpent}>
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Sélectionner la durée..." />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time} className="text-lg py-3">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        )}

        {/* Notes facultatives */}
        {missionConfirmed && selectedMaterials.length > 0 && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Notes supplémentaires (Facultatif)</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              className="min-h-24 text-base resize-none"
            />
          </Card>
        )}

        {/* Bouton de validation */}
        {missionConfirmed && (
          <div className="sticky bottom-0 bg-gradient-to-t from-blue-100 to-transparent pt-6 pb-6">
            <Button
              onClick={handleSubmit}
              disabled={selectedMaterials.length === 0 || !timeSpent}
              className="w-full h-20 text-2xl bg-green-600 hover:bg-green-700 shadow-2xl disabled:opacity-50"
            >
              <CheckCircle className="w-8 h-8 mr-3" />
              Valider ma journée
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
