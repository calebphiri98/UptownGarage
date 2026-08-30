import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Auth } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStaffAuth } from '../../context/StaffAuthContext.jsx'

export default function Login() {
  const { login: loginCustomer } = useAuth()
  const { setStaff } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await Auth.login(form.email, form.password)
      if (res.type === 'staff') {
        setStaff(res.user)
        navigate(location.state?.from || '/admin', { replace: true })
      } else {
        loginCustomer(res.user)
        navigate('/')
      }
    } catch (e) { setError(e.message) }
  }

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="muted">Access your account, bookings, orders and job status.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Password</label><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="amber" type="submit" style={{ width: '100%', marginTop: 8 }}>Log in</button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>No account yet? <Link to="/register">Create one</Link></p>
      </div>
    </section>
  )
}
