import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext.jsx'

export default function AdminLogin() {
  const { login } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
      const dest = location.state?.from || '/admin'
      navigate(dest, { replace: true })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="staff-login-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>Workshop Login</h1>
        <p className="muted">Administrator and manager access only.</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password</label><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="amber" type="submit" style={{ width: '100%', marginTop: 8 }}>Log in</button>
      </form>
    </div>
  )
}
