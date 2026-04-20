import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Send, FileText } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

// Mock data des demandes existantes
const existingRequests = [
  {
    id: 1,
    type: 'Transport',
    amount: 45.80,
    date: 'Lundi 15 Mars',
    description: 'Péage autoroute + parking',
    status: 'approved', // 'pending' | 'approved' | 'rejected'
  },
  {
    id: 2,
    type: 'Repas',
    amount: 28.50,
    date: 'Mardi 16 Mars',
    description: 'Déjeuner client',
    status: 'pending',
  },
  {
    id: 3,
    type: 'Matériel',
    amount: 156.00,
    date: 'Mercredi 17 Mars',
    description: 'Câbles réseau urgents',
    status: 'rejected',
  },
  {
    id: 4,
    type: 'Transport',
    amount: 65.20,
    date: 'Jeudi 18 Mars',
    description: 'Carburant mission longue distance',
    status: 'approved',
  },
];

const expenseTypes = [
  { value: 'transport', label: 'Transport' },
  { value: 'repas', label: 'Repas' },
  { value: 'materiel', label: 'Matériel' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'autre', label: 'Autre' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'bg-orange-100 text-orange-700 border-orange-300' };
    case 'approved':
      return { label: 'Approuvé', color: 'bg-green-100 text-green-700 border-green-300' };
    case 'rejected':
      return { label: 'Refusé', color: 'bg-red-100 text-red-700 border-red-300' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};

export default function TechnicianExpenseRequest() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !amount || !date || !description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Simulation d'envoi
    toast.success('Demande envoyée avec succès !', {
      description: 'Vous serez notifié de la validation',
    });

    // Reset form
    setSelectedType('');
    setAmount('');
    setDate('');
    setDescription('');
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 pb-8">
      {/* Header */}
      <div className="bg-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/technicien/dashboard')}
            className="p-2 hover:bg-purple-700 rounded-full"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-bold">Demande de Frais</h1>
          <div className="w-11" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Formulaire de demande */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            Nouvelle demande
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type de frais */}
            <div>
              <Label className="text-base font-bold mb-2 block">Type de frais *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-lg py-3">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Montant */}
            <div>
              <Label className="text-base font-bold mb-2 block">Montant (€) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Date */}
            <div>
              <Label className="text-base font-bold mb-2 block">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-base font-bold mb-2 block">Description *</Label>
              <Textarea
                placeholder="Détails de la dépense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 text-lg resize-none"
              />
            </div>

            {/* Upload justificatif */}
            <div>
              <Label className="text-base font-bold mb-2 block">Justificatif</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-3 h-14 px-4 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-purple-600" />
                  <span className="text-base font-medium text-purple-700">
                    {fileName || 'Ajouter une photo ou PDF'}
                  </span>
                </label>
              </div>
            </div>

            {/* Bouton submit */}
            <Button
              type="submit"
              className="w-full h-16 text-xl bg-purple-600 hover:bg-purple-700 shadow-lg"
            >
              <Send className="w-6 h-6 mr-3" />
              Envoyer la demande
            </Button>
          </form>
        </Card>

        {/* Liste des demandes existantes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mes demandes envoyées</h2>

          <div className="space-y-3">
            {existingRequests.map((request) => {
              const badge = getStatusBadge(request.status);
              return (
                <Card key={request.id} className="p-5 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          {request.type}
                        </h3>
                        <Badge className={`${badge.color} border`}>
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{request.date}</p>
                      <p className="text-sm text-gray-700">{request.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {request.amount.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
