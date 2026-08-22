import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Customers, Auth } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await Customers.create(form)
      const res = await Auth.login(form.email, form.password)
      login(res.customer)
      navigate('/')
    } catch (e) { setError(e.message) }
  }

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="muted">Register once — book services and order parts without re-entering your details.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Full name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Password</label><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="amber" type="submit" style={{ width: '100%', marginTop: 8 }}>Create account</button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  )
}
