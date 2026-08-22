import { useEffect, useState } from 'react'
import { Vehicles as VehiclesApi, Customers as CustomersApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'

export default function Vehicles() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ customer_id: '', make: '', model: '', year: '', plate_number: '' })
  const [error, setError] = useState('')

  const load = () => VehiclesApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load(); CustomersApi.list().then(setCustomers) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await VehiclesApi.create(form)
      setForm({ customer_id: '', make: '', model: '', year: '', plate_number: '' })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Vehicles</h1><p>A customer should not need to repeat vehicle information on every visit.</p></div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Register vehicle">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>Owner</label>
            <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Make</label><input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
          <div className="field"><label>Model</label><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div className="field"><label>Year</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div className="field"><label>Plate number</label><input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} /></div>
          <button className="amber" type="submit">Add vehicle</button>
        </form>
      </Panel>
      <Panel title={`All vehicles (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No vehicles yet.</p> : (
          <table>
            <thead><tr><th>Plate</th><th>Make / Model</th><th>Year</th><th>Owner</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td className="mono">{r.plate_number}</td><td>{r.make} {r.model}</td><td>{r.year || '—'}</td><td>{r.customer_name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  )
}
