import { useEffect, useState } from 'react'
import { Mechanics as MechanicsApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'

export default function Mechanics() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' })
  const [error, setError] = useState('')

  const load = () => MechanicsApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try { await MechanicsApi.create(form); setForm({ name: '', phone: '', specialty: '' }); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head"><div><h1>Mechanics</h1><p>Mechanics only work on jobs assigned to them.</p></div></div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Add mechanic">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Specialty</label><input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          <button className="amber" type="submit">Add</button>
        </form>
      </Panel>
      <Panel title={`Mechanics (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No mechanics yet.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Specialty</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.phone || '—'}</td><td>{r.specialty || '—'}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
    </>
  )
}
