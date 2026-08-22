import { useEffect, useState } from 'react'
import { Customers as CustomersApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'

export default function Customers() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const load = () => CustomersApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await CustomersApi.create(form)
      setForm({ name: '', email: '', phone: '', password: '' })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Customers</h1><p>Every customer needs an account before an online appointment can be created.</p></div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Register customer">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>Full name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Password</label><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="amber" type="submit">Register</button>
        </form>
      </Panel>
      <Panel title={`All customers (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No customers yet.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{r.phone || '—'}</td><td className="mono muted">{new Date(r.created_at).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  )
}
