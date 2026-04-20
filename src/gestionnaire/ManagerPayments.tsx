import { useState } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CreditCard, CheckCircle, Euro, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseItem {
  id: number;
  technician: string;
  mission: string;
  date: string;
  amount: number;
  validatedBy: string;
  validatedDate: string;
}

const initialExpenses: ExpenseItem[] = [
  {
    id: 1,
    technician: 'Jean Dupont',
    mission: 'Installation Datacenter A',
    date: '15 Mars 2026',
    amount: 125.50,
    validatedBy: 'Manager Principal',
    validatedDate: '16 Mars 2026',
  },
  {
    id: 2,
    technician: 'Marie Martin',
    mission: 'Maintenance Serveur B',
    date: '16 Mars 2026',
    amount: 85.00,
    validatedBy: 'Manager Principal',
    validatedDate: '17 Mars 2026',
  },
  {
    id: 3,
    technician: 'Pierre Durand',
    mission: 'Réparation urgente Système C',
    date: '17 Mars 2026',
    amount: 245.00,
    validatedBy: 'Manager Principal',
    validatedDate: '18 Mars 2026',
  },
  {
    id: 4,
    technician: 'Sophie Bernard',
    mission: 'Installation Réseau D',
    date: '18 Mars 2026',
    amount: 150.00,
    validatedBy: 'Manager Principal',
    validatedDate: '19 Mars 2026',
  },
  {
    id: 5,
    technician: 'Jean Dupont',
    mission: 'Maintenance préventive E',
    date: '19 Mars 2026',
    amount: 95.50,
    validatedBy: 'Manager Principal',
    validatedDate: '20 Mars 2026',
  },
];

export default function ManagerPayments() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split('T')[0],
    method: '',
    reference: '',
  });

  const totalSelected = selectedIds.reduce((sum, id) => {
    const expense = expenses.find(e => e.id === id);
    return sum + (expense?.amount || 0);
  }, 0);

  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) {
      setSelectedIds(expenses.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: CheckedState) => {
    if (checked === true) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleOpenModal = () => {
    if (selectedIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une note de frais');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentData.method) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }

    // Retirer les dépenses payées de la liste
    setExpenses(expenses.filter(e => !selectedIds.includes(e.id)));
    
    toast.success(`${selectedIds.length} remboursement(s) effectué(s) !`, {
      description: `Montant total: ${totalSelected.toFixed(2)}€`,
      duration: 4000,
    });

    // Reset
    setSelectedIds([]);
    setPaymentData({
      date: new Date().toISOString().split('T')[0],
      method: '',
      reference: '',
    });
    setIsModalOpen(false);
  };

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Paiement</h1>
          <p className="text-gray-600">Gérez les remboursements des notes de frais validées</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{expenses.length}</p>
                <p className="text-sm text-gray-600">Notes de frais à payer</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}€
                </p>
                <p className="text-sm text-gray-600">Montant total</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{selectedIds.length}</p>
                <p className="text-sm text-gray-600">Sélectionnées</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Notes de frais validées
            </h2>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Montant sélectionné</p>
                  <p className="text-2xl font-bold text-green-600">{totalSelected.toFixed(2)}€</p>
                </div>
                <Button 
                  onClick={handleOpenModal}
                  className="bg-green-600 hover:bg-green-700 h-12 px-6"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Effectuer le remboursement
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">
                    <Checkbox
                      checked={selectedIds.length === expenses.length && expenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Technicien</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mission</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date intervention</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Validé par</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date validation</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant validé</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <p className="text-xl font-semibold text-gray-900">Tous les remboursements sont à jour !</p>
                        <p className="text-gray-600">Aucune note de frais en attente de paiement</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr 
                      key={expense.id} 
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        selectedIds.includes(expense.id) ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedIds.includes(expense.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(expense.id, checked)
                          }
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{expense.technician}</td>
                      <td className="py-3 px-4 text-gray-700">{expense.mission}</td>
                      <td className="py-3 px-4 text-gray-600">{expense.date}</td>
                      <td className="py-3 px-4 text-gray-600">{expense.validatedBy}</td>
                      <td className="py-3 px-4 text-gray-600">{expense.validatedDate}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {expense.amount.toFixed(2)}€
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal de confirmation */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirmer le remboursement</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de rembourser {selectedIds.length} note(s) de frais
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Résumé */}
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Nombre de remboursements</span>
                  <span className="text-lg font-bold text-gray-900">{selectedIds.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Montant total</span>
                  <span className="text-2xl font-bold text-green-600">{totalSelected.toFixed(2)}€</span>
                </div>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="payment-date" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date du virement
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                />
              </div>

              {/* Mode de paiement */}
              <div>
                <Label htmlFor="payment-method" className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" />
                  Mode de paiement
                </Label>
                <Select value={paymentData.method} onValueChange={(value) => setPaymentData({ ...paymentData, method: value })}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Sélectionner un mode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">Virement bancaire</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Référence */}
              <div>
                <Label htmlFor="payment-ref" className="mb-2 block">
                  Référence de transaction (optionnel)
                </Label>
                <Input
                  id="payment-ref"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Ex: VIR-2026-03-001"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer le paiement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  );
}
