import { useState } from 'react';
import ManagerLayout from './ManagerLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Pencil, Trash2, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const initialTechnicians = [
  { id: 1, name: 'Jean Dupont', email: 'jean.dupont@entreprise.fr', phone: '06 12 34 56 78', status: 'Actif' },
  { id: 2, name: 'Marie Martin', email: 'marie.martin@entreprise.fr', phone: '06 23 45 67 89', status: 'Actif' },
  { id: 3, name: 'Pierre Durand', email: 'pierre.durand@entreprise.fr', phone: '06 34 56 78 90', status: 'Actif' },
  { id: 4, name: 'Sophie Bernard', email: 'sophie.bernard@entreprise.fr', phone: '06 45 67 89 01', status: 'Actif' },
];

const initialProjects = [
  { id: 1, name: 'Installation Datacenter A', client: 'Entreprise Alpha', location: 'Paris 15ème', status: 'En cours' },
  { id: 2, name: 'Maintenance Serveur B', client: 'Entreprise Beta', location: 'Issy-les-Moulineaux', status: 'En cours' },
  { id: 3, name: 'Réparation urgente Système C', client: 'Entreprise Gamma', location: 'Boulogne-Billancourt', status: 'Urgent' },
  { id: 4, name: 'Installation Réseau D', client: 'Entreprise Delta', location: 'Neuilly-sur-Seine', status: 'Planifié' },
];

export default function ManagerResources() {
  const [technicians, setTechnicians] = useState(initialTechnicians);
  const [projects, setProjects] = useState(initialProjects);
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const [newTechnician, setNewTechnician] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    location: '',
  });

  const handleAddTechnician = () => {
    if (!newTechnician.name || !newTechnician.email || !newTechnician.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const technician = {
      id: technicians.length + 1,
      ...newTechnician,
      status: 'Actif',
    };

    setTechnicians([...technicians, technician]);
    setNewTechnician({ name: '', email: '', phone: '' });
    setIsAddTechnicianOpen(false);
    toast.success('Technicien ajouté avec succès');
  };

  const handleAddProject = () => {
    if (!newProject.name || !newProject.client || !newProject.location) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const project = {
      id: projects.length + 1,
      ...newProject,
      status: 'Planifié',
    };

    setProjects([...projects, project]);
    setNewProject({ name: '', client: '', location: '' });
    setIsAddProjectOpen(false);
    toast.success('Projet ajouté avec succès');
  };

  const handleDeleteTechnician = (id: number) => {
    setTechnicians(technicians.filter(t => t.id !== id));
    toast.success('Technicien supprimé');
  };

  const handleDeleteProject = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
    toast.success('Projet supprimé');
  };

  return (
    <ManagerLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des ressources</h1>
          <p className="text-gray-600">Gérez vos techniciens et projets</p>
        </div>

        {/* Tabs */}
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

          {/* Techniciens Tab */}
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
                      <DialogDescription>
                        Ajoutez un nouveau technicien à l'équipe
                      </DialogDescription>
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
                    {technicians.map((tech) => (
                      <tr key={tech.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{tech.name}</td>
                        <td className="py-3 px-4 text-gray-600">{tech.email}</td>
                        <td className="py-3 px-4 text-gray-600">{tech.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {tech.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteTechnician(tech.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
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
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{project.name}</td>
                        <td className="py-3 px-4 text-gray-600">{project.client}</td>
                        <td className="py-3 px-4 text-gray-600">{project.location}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            project.status === 'Urgent' ? 'bg-red-100 text-red-700' :
                            project.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ManagerLayout>
  );
}
