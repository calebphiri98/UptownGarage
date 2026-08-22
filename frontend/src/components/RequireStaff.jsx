import { Navigate, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext.jsx'

export default function RequireStaff({ children }) {
  const { staff, loading } = useStaffAuth()
  const location = useLocation()

  if (loading) return <div className="staff-login-shell"><p className="empty">Checking session…</p></div>
  if (!staff) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  return children
}
