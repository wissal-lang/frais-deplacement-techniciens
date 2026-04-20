import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import LandingPage from './LandingPage.jsx'
import RequireManagerAuth from './gestionnaire/RequireManagerAuth'
import ManagerLogin from './gestionnaire/ManagerLogin'
import ManagerDashboard from './gestionnaire/ManagerDashboard'
import ManagerResources from './gestionnaire/ManagerResources'
import ManagerPlanningDragDrop from './gestionnaire/ManagerPlanningDragDrop'
import ManagerPlanningYear from './gestionnaire/ManagerPlanningYear'
import ManagerValidation from './gestionnaire/ManagerValidation'
import ManagerPayments from './gestionnaire/ManagerPayments'
import RequireTechnicianAuth from './technicien/RequireTechnicianAuth'
import TechnicianLogin from './technicien/TechnicianLogin'
import TechnicianDashboard from './technicien/TechnicianDashboard'
import TechnicianDailyFormNew from './technicien/TechnicianDailyFormNew'
import TechnicianExpenses from './technicien/TechnicianExpenses'

function LoginPlaceholder({ titre }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <p className="text-lg text-slate-700">{titre}</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/technicien/login" element={<TechnicianLogin />} />
        <Route element={<RequireTechnicianAuth />}>
          <Route
            path="/technicien/dashboard"
            element={<TechnicianDashboard />}
          />
          <Route
            path="/technicien/saisie"
            element={<TechnicianDailyFormNew />}
          />
          <Route path="/technicien/frais" element={<TechnicianExpenses />} />
        </Route>
        <Route path="/gestionnaire/login" element={<ManagerLogin />} />
        <Route element={<RequireManagerAuth />}>
          <Route
            path="/gestionnaire/dashboard"
            element={<ManagerDashboard />}
          />
          <Route
            path="/gestionnaire/ressources"
            element={<ManagerResources />}
          />
          <Route
            path="/gestionnaire/planning"
            element={<ManagerPlanningDragDrop />}
          />
          <Route
            path="/gestionnaire/planning-annuel"
            element={<ManagerPlanningYear />}
          />
          <Route
            path="/gestionnaire/validation"
            element={<ManagerValidation />}
          />
          <Route
            path="/gestionnaire/paiements"
            element={<ManagerPayments />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
