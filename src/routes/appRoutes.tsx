import { createBrowserRouter, Navigate } from 'react-router-dom'
import Root from '../components/Root'
import LandingPage from '../LandingPage.jsx'

// Technicien routes
import TechnicianLogin from '../technicien/TechnicianLogin'
import TechnicianDashboard from '../technicien/TechnicianDashboard'
import TechnicianDailyForm from '../technicien/TechnicianDailyFormNew'
import TechnicianExpenses from '../technicien/TechnicianExpenses'
import TechnicianExpenseRequest from '../technicien/TechnicianExpenseRequest'
import RequireTechnicianAuth from '../technicien/RequireTechnicianAuth'

// Gestionnaire routes
import ManagerLogin from '../gestionnaire/ManagerLogin'
import ManagerDashboard from '../gestionnaire/ManagerDashboard'
import ManagerResources from '../gestionnaire/ManagerResources'
import ManagerPlanning from '../gestionnaire/ManagerPlanningDragDrop'
import ManagerPlanningYear from '../gestionnaire/ManagerPlanningYear'
import ManagerValidation from '../gestionnaire/ManagerValidation'
import ManagerPayments from '../gestionnaire/ManagerPayments'
import RequireManagerAuth from '../gestionnaire/RequireManagerAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: LandingPage },

      // Routes Technicien (public)
      { path: 'technicien/login', Component: TechnicianLogin },
      {
        Component: RequireTechnicianAuth,
        children: [
          { path: 'technicien/dashboard', Component: TechnicianDashboard },
          { path: 'technicien/saisie', Component: TechnicianDailyForm },
          { path: 'technicien/frais', Component: TechnicianExpenses },
          {
            path: 'technicien/demande-frais',
            Component: TechnicianExpenseRequest,
          },
        ],
      },

      // Routes Gestionnaire (public)
      { path: 'gestionnaire/login', Component: ManagerLogin },
      {
        Component: RequireManagerAuth,
        children: [
          { path: 'gestionnaire/dashboard', Component: ManagerDashboard },
          { path: 'gestionnaire/ressources', Component: ManagerResources },
          { path: 'gestionnaire/planning', Component: ManagerPlanning },
          {
            path: 'gestionnaire/planning-annuel',
            Component: ManagerPlanningYear,
          },
          { path: 'gestionnaire/validation', Component: ManagerValidation },
          { path: 'gestionnaire/paiements', Component: ManagerPayments },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
