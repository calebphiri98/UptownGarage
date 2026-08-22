import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PublicLayout({ children }) {
  const { customer, logout } = useAuth()

  return (
    <div className="public-shell">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark">UG</span>
          <div>
            <div className="brand-name">UPTOWN GARAGE</div>
            <div className="brand-sub">Auto Service &amp; Parts</div>
          </div>
        </Link>
        <nav className="topnav">
          <NavLink to="/" end className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>Home</NavLink>
          <NavLink to="/shop" className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>Shop Parts</NavLink>
          <NavLink to="/book" className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>Book Service</NavLink>
          <NavLink to="/admin" className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>Workshop Login</NavLink>
        </nav>
        <div className="topbar-account">
          {customer ? (
            <>
              <span className="account-name">Hi, {customer.name.split(' ')[0]}</span>
              <button className="ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost-link">Log in</Link>
              <Link to="/register" className="btn amber-link">Create account</Link>
            </>
          )}
        </div>
      </header>
      <main className="public-content">{children}</main>
      <footer className="public-footer">
        <span>© {new Date().getFullYear()} Uptown Garage — Where every job gets a job card.</span>
      </footer>
    </div>
  )
}
