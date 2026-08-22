import { NavLink, Link } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext.jsx'

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/vehicles', label: 'Vehicles' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/jobs', label: 'Job Cards' },
  { to: '/admin/mechanics', label: 'Mechanics' },
  { to: '/admin/parts', label: 'Inventory' },
  { to: '/admin/orders', label: 'Parts Orders' },
  { to: '/admin/invoices', label: 'Invoices' },
]

export default function AdminLayout({ children }) {
  const { staff, logout } = useStaffAuth()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">UG</span>
          <div>
            <div className="brand-name">UPTOWN GARAGE</div>
            <div className="brand-sub">Workshop Control</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="nav-link" style={{ marginTop: 8 }}>← View public site</Link>
        <div className="sidebar-foot">
          {staff && (
            <div style={{ marginBottom: 8 }}>
              Signed in as <strong>{staff.name}</strong>
              <div style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', color: 'var(--amber)' }}>{staff.role}</div>
            </div>
          )}
          <button className="ghost ghost-link" onClick={logout} style={{ width: '100%' }}>Log out</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
