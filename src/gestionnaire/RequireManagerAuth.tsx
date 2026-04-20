import { Navigate, Outlet } from 'react-router-dom'
import { isManagerAuthenticated } from './managerSession'

export default function RequireManagerAuth() {
  if (!isManagerAuthenticated()) {
    return <Navigate to="/gestionnaire/login" replace />
  }
  return <Outlet />
}
