import { useEffect, useState } from 'react'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Plus, Pencil, Trash2, User, Briefcase } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

interface TechnicianRow {
  id: number
  nom: string
  prenom: string | null
  email: string
  telephone: string | null
  matricule: string | null
  actif: boolean
}

interface ProjectRow {
  id: number
  nom: string
  client: string
  localisation: string
  statut: string
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return {
    nom: parts[0] || '',
    prenom: parts.slice(1).join(' ') || null,
  }
}

function projectStatusLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('urgent')) return 'Urgent'
  if (normalized.includes('term')) return 'Terminé'
  if (normalized.includes('cours')) return 'En cours'
  return 'Planifié'
}

const EMPTY_NEW_TECH = { name: '', email: '', phone: '', matricule: '', password: '' }
// Note : pas de champ "password" ici. Le gestionnaire n'a PAS le droit de
// changer le mot de passe d'un technicien — il peut seulement le réinitialiser.
const EMPTY_EDIT_TECH = { name: '', email: '', phone: '', matricule: '' }

export default function ManagerResources() {
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // État ajout
  const [newTechnician, setNewTechnician] = useState(EMPTY_NEW_TECH)

  // État modification
  const [editingTech, setEditingTech] = useState<TechnicianRow | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_TECH)
  const [isSaving, setIsSaving] = useState(false)

  // État suppression technicien
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // État réinitialisation mot de passe (affichage du mot de passe temporaire généré)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const [newProject, setNewProject] = useState({ name: '', client: '', location: '' })

  // État modification projet
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [editProjectForm, setEditProjectForm] = useState({ name: '', client: '', location: '', statut: '' })
  const [isSavingProject, setIsSavingProject] = useState(false)

  const loadResources = async () => {
    const token = getManagerToken()
    if (!token) { setIsLoading(false); return }
    try {
      const [technicianData, projectData] = await Promise.all([
        // actif=true : on n'affiche que les techniciens actifs
        apiFetch<{ users: TechnicianRow[] }>('/api/users?role=TECHNICIEN&actif=true', { token }),
        apiFetch<{ projets: ProjectRow[] }>('/api/projets', { token }),
      ])
      setTechnicians(technicianData.users)
      setProjects(projectData.projets)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les ressources')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadResources() }, [])

  // ── Ajout technicien ────────────────────────────────────────────────────────
  const handleAddTechnician = async () => {
    if (!newTechnician.name || !newTechnician.email || !newTechnician.phone || !newTechnician.password) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    const { nom, prenom } = splitName(newTechnician.name)
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        token,
        body: {
          nom,
          prenom,
          email: newTechnician.email,
          password: newTechnician.password,
          telephone: newTechnician.phone,
          matricule: newTechnician.matricule || undefined,
          role: 'TECHNICIEN',
          actif: true,
        },
      })
      setNewTechnician(EMPTY_NEW_TECH)
      setIsAddTechnicianOpen(false)
      toast.success('Technicien ajouté avec succès')
      await loadResources()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le technicien')
    }
  }

  // ── Ouvrir la modale de modification ────────────────────────────────────────
  const openEdit = (tech: TechnicianRow) => {
    setEditingTech(tech)
    setTemporaryPassword(null)
    setEditForm({
      name: [tech.nom, tech.prenom].filter(Boolean).join(' '),
      email: tech.email,
      phone: tech.telephone || '',
      matricule: tech.matricule || '',
    })
    setIsEditOpen(true)
  }

  // ── Sauvegarder la modification ─────────────────────────────────────────────
  const handleSaveTechnician = async () => {
    if (!editingTech) return
    if (!editForm.name || !editForm.email || !editForm.phone) {
      toast.error('Nom, email et téléphone sont obligatoires')
      return
    }
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    const { nom, prenom } = splitName(editForm.name)
    setIsSaving(true)
    try {
      await apiFetch(`/api/users/${editingTech.id}`, {
        method: 'PUT',
        token,
        body: {
          nom,
          prenom,
          email: editForm.email,
          telephone: editForm.phone,
          matricule: editForm.matricule || undefined,
          // Pas de mot de passe : interdit pour un technicien (règle métier).
        },
      })
      setIsEditOpen(false)
      setEditingTech(null)
      toast.success('Technicien mis à jour')
      await loadResources()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de modifier le technicien')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Réinitialiser le mot de passe d'un technicien ───────────────────────────
  // Le gestionnaire ne choisit pas le mot de passe : le serveur en génère un
  // temporaire et le renvoie une seule fois pour qu'on le communique au technicien.
  const handleResetPassword = async () => {
    if (!editingTech) return
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    setIsResettingPassword(true)
    setTemporaryPassword(null)
    try {
      const res = await apiFetch<{ temporaryPassword: string }>(
        `/api/users/${editingTech.id}/reset-password`,
        { method: 'POST', token },
      )
      setTemporaryPassword(res.temporaryPassword)
      toast.success('Mot de passe réinitialisé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Réinitialisation impossible')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // ── Supprimer technicien ─────────────────────────────────────────────────────
  const handleDeleteTechnician = async (id: number) => {
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    setDeletingId(id)
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE', token })
      // Retrait immédiat de la liste sans recharger
      setTechnicians((current) => current.filter((t) => t.id !== id))
      toast.success('Technicien supprimé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le technicien')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Projet ───────────────────────────────────────────────────────────────────
  const handleAddProject = async () => {
    if (!newProject.name || !newProject.client || !newProject.location) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    try {
      await apiFetch('/api/projets', {
        method: 'POST',
        token,
        body: { nom: newProject.name, client: newProject.client, localisation: newProject.location, statut: 'planifie' },
      })
      setNewProject({ name: '', client: '', location: '' })
      setIsAddProjectOpen(false)
      toast.success('Projet ajouté avec succès')
      await loadResources()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le projet')
    }
  }

  const handleDeleteProject = async (id: number) => {
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    try {
      await apiFetch(`/api/projets/${id}`, { method: 'DELETE', token })
      setProjects((current) => current.filter((p) => p.id !== id))
      toast.success('Projet supprimé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le projet')
    }
  }

  // ── Ouvrir la modale de modification projet ──────────────────────────────────
  const openEditProject = (project: ProjectRow) => {
    setEditingProject(project)
    setEditProjectForm({
      name: project.nom,
      client: project.client,
      location: project.localisation,
      statut: project.statut,
    })
    setIsEditProjectOpen(true)
  }

  // ── Sauvegarder la modification projet ──────────────────────────────────────
  const handleSaveProject = async () => {
    if (!editingProject) return
    if (!editProjectForm.name || !editProjectForm.client || !editProjectForm.location) {
      toast.error('Nom, client et localisation sont obligatoires')
      return
    }
    const token = getManagerToken()
    if (!token) { toast.error('Session expirée'); return }
    setIsSavingProject(true)
    try {
      await apiFetch(`/api/projets/${editingProject.id}`, {
        method: 'PUT',
        token,
        body: {
          nom: editProjectForm.name,
          client: editProjectForm.client,
          localisation: editProjectForm.location,
          statut: editProjectForm.statut,
        },
      })
      setIsEditProjectOpen(false)
      setEditingProject(null)
      toast.success('Projet mis à jour')
      await loadResources()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de modifier le projet')
    } finally {
      setIsSavingProject(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  return (
    <ManagerLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des ressources</h1>
          <p className="text-gray-600">Gérez vos techniciens et projets</p>
        </div>

        <Tabs defaultValue="technicians" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="technicians" className="text-lg px-6 py-3">
              <User className="w-5 h-5 mr-2" />
              Techniciens
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-lg px-6 py-3">
              <Briefcase className="w-5 h-5 mr-2" />
              Projets
            </TabsTrigger>
          </TabsList>

          {/* ── Onglet Techniciens ── */}
          <TabsContent value="technicians">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Liste des techniciens ({technicians.length})
                </h2>
                <Dialog open={isAddTechnicianOpen} onOpenChange={setIsAddTechnicianOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Ajouter un technicien
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau technicien</DialogTitle>
                      <DialogDescription>Ajoutez un nouveau technicien à l'équipe</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="tech-name">Nom complet *</Label>
                        <Input
                          id="tech-name"
                          value={newTechnician.name}
                          onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                          placeholder="Ex: Jean Dupont"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-email">Email *</Label>
                        <Input
                          id="tech-email"
                          type="email"
                          value={newTechnician.email}
                          onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                          placeholder="jean.dupont@entreprise.fr"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-password">Mot de passe *</Label>
                        <Input
                          id="tech-password"
                          type="password"
                          value={newTechnician.password}
                          onChange={(e) => setNewTechnician({ ...newTechnician, password: e.target.value })}
                          placeholder="Mot de passe temporaire"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-phone">Téléphone *</Label>
                        <Input
                          id="tech-phone"
                          value={newTechnician.phone}
                          onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-matricule">Matricule</Label>
                        <Input
                          id="tech-matricule"
                          value={newTechnician.matricule}
                          onChange={(e) => setNewTechnician({ ...newTechnician, matricule: e.target.value })}
                          placeholder="Optionnel, ex: TECH-0001"
                        />
                      </div>
                      <Button onClick={handleAddTechnician} className="w-full bg-green-600 hover:bg-green-700">
                        Ajouter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Téléphone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Chargement...</td>
                      </tr>
                    ) : technicians.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Aucun technicien trouvé</td>
                      </tr>
                    ) : (
                      technicians.map((tech) => (
                        <tr key={tech.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {[tech.nom, tech.prenom].filter(Boolean).join(' ')}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{tech.email}</td>
                          <td className="py-3 px-4 text-gray-600">{tech.telephone || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                              Actif
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(tech)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === tech.id}
                                onClick={() => handleDeleteTechnician(tech.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── Onglet Projets ── */}
          <TabsContent value="projects">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Liste des projets ({projects.length})
                </h2>
                <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Créer un projet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau projet</DialogTitle>
                      <DialogDescription>Créez un nouveau projet d'intervention</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="proj-name">Nom du projet</Label>
                        <Input
                          id="proj-name"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          placeholder="Ex: Installation Datacenter"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proj-client">Client</Label>
                        <Input
                          id="proj-client"
                          value={newProject.client}
                          onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                          placeholder="Ex: Entreprise Alpha"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proj-location">Localisation</Label>
                        <Input
                          id="proj-location"
                          value={newProject.location}
                          onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                          placeholder="Ex: Paris 15ème"
                        />
                      </div>
                      <Button onClick={handleAddProject} className="w-full bg-green-600 hover:bg-green-700">
                        Créer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Projet</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Localisation</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Chargement...</td>
                      </tr>
                    ) : projects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Aucun projet trouvé</td>
                      </tr>
                    ) : (
                      projects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{project.nom}</td>
                          <td className="py-3 px-4 text-gray-600">{project.client}</td>
                          <td className="py-3 px-4 text-gray-600">{project.localisation}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              projectStatusLabel(project.statut) === 'Urgent'   ? 'bg-red-100 text-red-700' :
                              projectStatusLabel(project.statut) === 'En cours' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {projectStatusLabel(project.statut)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditProject(project)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Dialog modification technicien ── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le technicien</DialogTitle>
              <DialogDescription>Modifiez les informations du technicien</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-name">Nom complet *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Téléphone *</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="edit-matricule">Matricule</Label>
                <Input
                  id="edit-matricule"
                  value={editForm.matricule}
                  onChange={(e) => setEditForm({ ...editForm, matricule: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Label className="mb-1 block">Mot de passe</Label>
                <p className="mb-3 text-xs text-gray-500">
                  Vous ne pouvez pas définir le mot de passe d'un technicien. Vous pouvez le
                  réinitialiser : un mot de passe temporaire sera généré et affiché une seule fois.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </Button>
                {temporaryPassword && (
                  <div className="mt-3 rounded-md border border-green-300 bg-green-50 p-3">
                    <p className="text-xs text-green-700">Mot de passe temporaire (à communiquer au technicien) :</p>
                    <p className="mt-1 select-all font-mono text-lg font-bold text-green-900">{temporaryPassword}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                  Annuler
                </Button>
                <Button onClick={handleSaveTechnician} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Dialog modification projet ── */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
              <DialogDescription>Modifiez les informations du projet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-proj-name">Nom du projet *</Label>
                <Input
                  id="edit-proj-name"
                  value={editProjectForm.name}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  placeholder="Ex: Installation Datacenter"
                />
              </div>
              <div>
                <Label htmlFor="edit-proj-client">Client *</Label>
                <Input
                  id="edit-proj-client"
                  value={editProjectForm.client}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, client: e.target.value })}
                  placeholder="Ex: Entreprise Alpha"
                />
              </div>
              <div>
                <Label htmlFor="edit-proj-location">Localisation *</Label>
                <Input
                  id="edit-proj-location"
                  value={editProjectForm.location}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, location: e.target.value })}
                  placeholder="Ex: Paris 15ème"
                />
              </div>
              <div>
                <Label htmlFor="edit-proj-statut">Statut</Label>
                <Select
                  value={editProjectForm.statut}
                  onValueChange={(v) => setEditProjectForm({ ...editProjectForm, statut: v })}
                >
                  <SelectTrigger id="edit-proj-statut">
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planifie">Planifié</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditProjectOpen(false)} disabled={isSavingProject}>
                  Annuler
                </Button>
                <Button onClick={handleSaveProject} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSavingProject}>
                  {isSavingProject ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  )
}
