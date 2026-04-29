import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LayoutDashboard, Users, Calendar, CheckSquare, LogOut, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { clearManagerSession } from './managerSession';

interface ManagerLayoutProps {
  children: ReactNode;
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', path: '/gestionnaire/dashboard', icon: LayoutDashboard },
    { name: 'Ressources', path: '/gestionnaire/ressources', icon: Users },
    { name: 'Planning Hebdo', path: '/gestionnaire/planning', icon: Calendar },
    { name: 'Validation', path: '/gestionnaire/validation', icon: CheckSquare },
    { name: 'Paiements', path: '/gestionnaire/paiements', icon: CreditCard },
  ];

  const handleLogout = () => {
    clearManagerSession();
    navigate('/gestionnaire/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-green-600">Gestion Interventions</h1>
          <p className="text-sm text-gray-600 mt-1">Espace Gestionnaire</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            type="button"
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}