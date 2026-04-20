/**
 * Formulaire « wizard » multi-étapes (projet → type → description → durée).
 * La route `/technicien/saisie` utilise `TechnicianDailyFormNew` (flux mission du jour).
 * Ce composant reste disponible pour réutilisation ou branchement ultérieur.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, Clock, FileText, Wrench } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'

const projects = [
  'Installation Datacenter A',
  'Maintenance Serveur B',
  'Réparation urgente Système C',
  'Installation Réseau D',
  'Maintenance préventive E',
]

const timeOptions = [
  '0h30',
  '1h00',
  '1h30',
  '2h00',
  '2h30',
  '3h00',
  '3h30',
  '4h00',
  '4h30',
  '5h00',
  '5h30',
  '6h00',
  '6h30',
  '7h00',
  '7h30',
  '8h00',
]

type WorkType = 'installation' | 'maintenance' | 'urgent' | ''

interface DailyFormState {
  project: string
  workType: WorkType
  description: string
  timeSpent: string
}

export default function TechnicianDailyForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<DailyFormState>({
    project: '',
    workType: '',
    description: '',
    timeSpent: '',
  })

  const handleWorkTypeSelect = (type: WorkType) => {
    setFormData((prev) => ({ ...prev, workType: type }))
    setTimeout(() => setStep(3), 300)
  }

  const handleSubmit = () => {
    if (
      !formData.project ||
      !formData.workType ||
      !formData.description.trim() ||
      !formData.timeSpent
    ) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    toast.success('Saisie enregistrée avec succès !', {
      description: 'Votre intervention a été ajoutée au planning réel.',
    })

    setTimeout(() => {
      navigate('/technicien/dashboard')
    }, 1500)
  }

  const getWorkTypeColor = (type: WorkType) => {
    switch (type) {
      case 'installation':
        return 'border-green-600 bg-green-500 hover:bg-green-600'
      case 'maintenance':
        return 'border-blue-600 bg-blue-500 hover:bg-blue-600'
      case 'urgent':
        return 'border-red-600 bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-blue-600 p-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() =>
              step > 1 ? setStep(step - 1) : navigate('/technicien/dashboard')
            }
            className="rounded-full p-2 hover:bg-blue-700"
            aria-label="Retour"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <h1 className="text-2xl font-bold">Saisie Journalière</h1>
          <div className="w-11" />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md px-4">
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  s <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`mx-2 h-1 flex-1 ${s < step ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-8">
        {step === 1 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Quel projet ?
              </h2>
              <p className="text-gray-600">Sélectionnez le projet concerné</p>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                Projet
              </label>
              <Select
                value={formData.project || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, project: value }))
                }
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Choisir un projet..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project}
                      value={project}
                      className="py-3 text-lg"
                    >
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.project}
                className="mt-6 h-16 w-full bg-blue-600 text-xl hover:bg-blue-700"
              >
                Suivant
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Type de travail
              </h2>
              <p className="text-gray-600">Qu&apos;avez-vous effectué ?</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleWorkTypeSelect('installation')}
                className={`flex h-24 w-full items-center justify-center gap-3 rounded-xl border-4 text-xl font-bold text-white transition-all ${getWorkTypeColor('installation')}`}
              >
                <CheckCircle className="h-8 w-8" />
                Installation
              </button>

              <button
                type="button"
                onClick={() => handleWorkTypeSelect('maintenance')}
                className={`flex h-24 w-full items-center justify-center gap-3 rounded-xl border-4 text-xl font-bold text-white transition-all ${getWorkTypeColor('maintenance')}`}
              >
                <Wrench className="h-8 w-8" />
                Maintenance programmée
              </button>

              <button
                type="button"
                onClick={() => handleWorkTypeSelect('urgent')}
                className={`flex h-24 w-full items-center justify-center gap-3 rounded-xl border-4 text-xl font-bold text-white transition-all ${getWorkTypeColor('urgent')}`}
              >
                <Clock className="h-8 w-8" />
                Réparation urgente
              </button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Description
              </h2>
              <p className="text-gray-600">
                Décrivez brièvement votre intervention
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                Détails de l&apos;intervention
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Ex: Installation des serveurs, câblage réseau effectué, tests de connexion réussis..."
                className="min-h-40 resize-none text-lg"
              />

              <Button
                type="button"
                onClick={() => setStep(4)}
                disabled={!formData.description.trim()}
                className="mt-6 h-16 w-full bg-blue-600 text-xl hover:bg-blue-700"
              >
                Suivant
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Temps passé
              </h2>
              <p className="text-gray-600">
                Combien de temps avez-vous passé ?
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                Durée
              </label>
              <Select
                value={formData.timeSpent || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, timeSpent: value }))
                }
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      className="py-3 text-lg"
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6 rounded-xl bg-blue-50 p-4">
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  Récapitulatif
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Projet :</strong> {formData.project}
                  </p>
                  <p>
                    <strong>Type :</strong>{' '}
                    {formData.workType === 'installation'
                      ? 'Installation'
                      : formData.workType === 'maintenance'
                        ? 'Maintenance programmée'
                        : 'Réparation urgente'}
                  </p>
                  <p>
                    <strong>Description :</strong> {formData.description}
                  </p>
                  {formData.timeSpent ? (
                    <p>
                      <strong>Temps :</strong> {formData.timeSpent}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!formData.timeSpent}
                className="mt-6 h-16 w-full bg-green-600 text-xl hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-6 w-6" />
                Valider la saisie
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
