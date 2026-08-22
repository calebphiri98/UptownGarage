import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await Auth.login(form.email, form.password)
      login(res.customer)
      navigate('/')
    } catch (e) { setError(e.message) }
  }

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="muted">Access your bookings, orders and job status.</p>
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
