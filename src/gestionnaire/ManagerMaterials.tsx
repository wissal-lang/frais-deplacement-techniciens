import { useEffect, useState } from 'react'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

interface Material {
  id: number
  reference: string | null
  nom: string
  description: string
  categorie: string | null
  quantiteStock: number
  unite: string
  prixUnitaire: number | null
  actif: boolean
}

interface MaterialForm {
  reference: string
  nom: string
  description: string
  categorie: string
  quantiteStock: string
  unite: string
  prixUnitaire: string
}

const EMPTY_FORM: MaterialForm = {
  reference: '',
  nom: '',
  description: '',
  categorie: '',
  quantiteStock: '0',
  unite: 'unité',
  prixUnitaire: '',
}

function toForm(material: Material): MaterialForm {
  return {
    reference: material.reference || '',
    nom: material.nom,
    description: material.description || '',
    categorie: material.categorie || '',
    quantiteStock: String(material.quantiteStock ?? 0),
    unite: material.unite || 'unité',
    prixUnitaire: material.prixUnitaire !== null ? String(material.prixUnitaire) : '',
  }
}

export default function ManagerMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadMaterials = async () => {
    const token = getManagerToken()
    if (!token) { setIsLoading(false); return }
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
      const data = await apiFetch<{ materiaux: Material[] }>(`/api/materiaux${query}`, { token })
      setMaterials(data.materiaux)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les matériaux')
    } finally {
      setIsLoading(false)
    }
  }

  // Recharge à l'ouverture et quand la recherche change (léger debounce).
  useEffect(() => {
    const timer = setTimeout(loadMaterials, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEdit = (material: Material) => {
    setEditingId(material.id)
    setForm(toForm(material))
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error('Le nom du matériau est obligatoire')
      return
    }
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }

    const payload = {
      reference: form.reference.trim() || null,
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      categorie: form.categorie.trim() || null,
      quantite_stock: Number.parseInt(form.quantiteStock, 10) || 0,
      unite: form.unite.trim() || 'unité',
      prix_unitaire: form.prixUnitaire.trim() === '' ? null : Number(form.prixUnitaire),
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await apiFetch(`/api/materiaux/${editingId}`, { method: 'PUT', token, body: payload })
        toast.success('Matériau mis à jour')
      } else {
        await apiFetch('/api/materiaux', { method: 'POST', token, body: payload })
        toast.success('Matériau ajouté')
      }
      setIsFormOpen(false)
      setEditingId(null)
      await loadMaterials()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement impossible')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (material: Material) => {
    if (!window.confirm(`Supprimer le matériau "${material.nom}" ?`)) return
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    setDeletingId(material.id)
    try {
      await apiFetch(`/api/materiaux/${material.id}`, { method: 'DELETE', token })
      setMaterials((current) => current.filter((m) => m.id !== material.id))
      toast.success('Matériau supprimé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ManagerLayout>
      <div className="p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Liste des matériaux</h1>
            <p className="text-gray-600">Gérez le catalogue de matériaux (ajout, modification, suppression).</p>
          </div>
          <Button type="button" onClick={openCreate} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau matériau
          </Button>
        </div>

        <Card className="mb-6 p-4">
          <Label htmlFor="material-search">Rechercher</Label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="material-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, référence ou catégorie..."
              className="pl-9"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b p-6">
            <Package className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {materials.length} matériau{materials.length > 1 ? 'x' : ''}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="p-4 font-semibold">Référence</th>
                  <th className="p-4 font-semibold">Nom</th>
                  <th className="p-4 font-semibold">Catégorie</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">Prix unitaire</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Chargement...</td></tr>
                ) : materials.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Aucun matériau pour le moment.</td></tr>
                ) : (
                  materials.map((material) => (
                    <tr key={material.id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-gray-700">{material.reference || '—'}</td>
                      <td className="p-4 font-medium text-gray-900">
                        {material.nom}
                        {material.description ? (
                          <p className="text-xs font-normal text-gray-500">{material.description}</p>
                        ) : null}
                      </td>
                      <td className="p-4 text-gray-700">{material.categorie || '—'}</td>
                      <td className="p-4 text-gray-700">
                        {material.quantiteStock} {material.unite}
                      </td>
                      <td className="p-4 text-gray-700">
                        {material.prixUnitaire !== null ? `${material.prixUnitaire.toFixed(2)} MAD` : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(material)}
                            className="rounded-md p-2 text-blue-600 transition hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(material)}
                            disabled={deletingId === material.id}
                            className="rounded-md p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier le matériau' : 'Nouveau matériau'}</DialogTitle>
              <DialogDescription>Renseignez les informations du matériau.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 pt-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mat-reference">Référence</Label>
                <Input
                  id="mat-reference"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="MAT-0001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-categorie">Catégorie</Label>
                <Input
                  id="mat-categorie"
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  placeholder="Outillage, Câblage..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mat-nom">Nom *</Label>
                <Input
                  id="mat-nom"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Câble réseau RJ45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-stock">Quantité en stock</Label>
                <Input
                  id="mat-stock"
                  type="number"
                  min="0"
                  value={form.quantiteStock}
                  onChange={(e) => setForm({ ...form, quantiteStock: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-unite">Unité</Label>
                <Input
                  id="mat-unite"
                  value={form.unite}
                  onChange={(e) => setForm({ ...form, unite: e.target.value })}
                  placeholder="unité, mètre, kg..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-prix">Prix unitaire (MAD)</Label>
                <Input
                  id="mat-prix"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.prixUnitaire}
                  onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mat-description">Description</Label>
                <Textarea
                  id="mat-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Détails du matériau..."
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  )
}
