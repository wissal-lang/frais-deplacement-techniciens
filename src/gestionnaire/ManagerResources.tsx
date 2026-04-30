import { useEffect, useState } from 'react'
import ManagerLayout from './ManagerLayout'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Plus, Pencil, Trash2, User, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '../lib/api'
import { getManagerToken } from './managerSession'

interface TechnicianRow {
  id: number
  nom: string
  prenom: string | null
  email: string
  telephone: string | null
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

export default function ManagerResources() {
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [newTechnician, setNewTechnician] = useState({
    name: '',
    email: '',
    phone: '',
    matricule: '',
    password: 'password123',
  })

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    location: '',
  })

  const loadResources = async () => {
    const token = getManagerToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const [technicianData, projectData] = await Promise.all([
        apiFetch<{ users: TechnicianRow[] }>('/api/users?role=TECHNICIEN', { token }),
        apiFetch<{ projets: ProjectRow[] }>('/api/projets', { token }),
      ])
      setTechnicians(technicianData.users)
      setProjects(projectData.projets)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger les ressources'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleAddTechnician = async () => {
    if (!newTechnician.name || !newTechnician.email || !newTechnician.phone) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    const token = getManagerToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

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
          matricule: newTechnician.matricule,
          role: 'TECHNICIEN',
          actif: true,
        },
      })

      setNewTechnician({ name: '', email: '', phone: '', matricule: '', password: 'password123' })
      setIsAddTechnicianOpen(false)
      toast.success('Technicien ajouté avec succès')
      await loadResources()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de créer le technicien'
      toast.error(message)
    }
  }

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.client || !newProject.location) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    const token = getManagerToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

    try {
      await apiFetch('/api/projets', {
        method: 'POST',
        token,
        body: {
          nom: newProject.name,
          client: newProject.client,
          localisation: newProject.location,
          statut: 'planifie',
        },
      })

      setNewProject({ name: '', client: '', location: '' })
      setIsAddProjectOpen(false)
      toast.success('Projet ajouté avec succès')
      await loadResources()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de créer le projet'
      toast.error(message)
    }
  }

  const handleDeleteTechnician = async (id: number) => {
    const token = getManagerToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE', token })
      toast.success('Technicien supprimé')
      await loadResources()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le technicien'
      toast.error(message)
    }
  }

  const handleDeleteProject = async (id: number) => {
    const token = getManagerToken()
    if (!token) {
      toast.error('Session expirée')
      return
    }

    try {
      await apiFetch(`/api/projets/${id}`, { method: 'DELETE', token })
      toast.success('Projet supprimé')
      await loadResources()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le projet'
      toast.error(message)
    }
  }

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
                        <Label htmlFor="tech-name">Nom complet</Label>
                        <Input
                          id="tech-name"
                          value={newTechnician.name}
                          onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                          placeholder="Ex: Jean Dupont"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-email">Email</Label>
                        <Input
                          id="tech-email"
                          type="email"
                          value={newTechnician.email}
                          onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                          placeholder="jean.dupont@entreprise.fr"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tech-password">Mot de passe</Label>
                        <Input
                          id="tech-password"
                          type="password"
                          value={newTechnician.password}
                          onChange={(e) => setNewTechnician({ ...newTechnician, password: e.target.value })}
                          placeholder="Mot de passe temporaire"
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
                      <div>
                        <Label htmlFor="tech-phone">Téléphone</Label>
                        <Input
                          id="tech-phone"
                          value={newTechnician.phone}
                          onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
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
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${tech.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {tech.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTechnician(tech.id)}>
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
                      <DialogDescription>
                        Créez un nouveau projet d'intervention
                      </DialogDescription>
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
                              projectStatusLabel(project.statut) === 'Urgent' ? 'bg-red-100 text-red-700' :
                              projectStatusLabel(project.statut) === 'En cours' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {projectStatusLabel(project.statut)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
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
      </div>
    </ManagerLayout>
  )
}
