import { Navigate, Outlet } from 'react-router-dom'
import { isTechnicianAuthenticated } from './technicianSession'

export default function RequireTechnicianAuth() {
  if (!isTechnicianAuthenticated()) {
    return <Navigate to="/technicien/login" replace />
  }
  return <Outlet />
}
