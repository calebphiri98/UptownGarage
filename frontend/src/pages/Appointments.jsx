import { useEffect, useState } from 'react'
import { Appointments as AppointmentsApi, Customers as CustomersApi, Vehicles as VehiclesApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'
import Badge from '../components/Badge.jsx'

const STATUSES = ['Pending', 'Confirmed', 'Arrived', 'Converted', 'Cancelled', 'No-show']

export default function Appointments() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState({ customer_id: '', vehicle_id: '', service_type: '', requested_date: '' })
  const [error, setError] = useState('')

  const load = () => AppointmentsApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load(); CustomersApi.list().then(setCustomers); VehiclesApi.list().then(setVehicles) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await AppointmentsApi.create(form)
      setForm({ customer_id: '', vehicle_id: '', service_type: '', requested_date: '' })
      load()
    } catch (e) { setError(e.message) }
  }

  const setStatus = async (id, status) => {
    setError('')
    try { await AppointmentsApi.update(id, { status }); load() } catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Appointments</h1><p>Only the Garage Administrator can confirm, reschedule or cancel an appointment.</p></div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Request appointment">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>Customer</label>
            <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Vehicle</label>
            <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </select>
          </div>
          <div className="field"><label>Service type</label><input required value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} /></div>
          <div className="field"><label>Date &amp; time</label><input required type="datetime-local" value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} /></div>
          <button className="amber" type="submit">Request</button>
        </form>
      </Panel>
      <Panel title={`All appointments (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No appointments yet.</p> : (
          <table>
            <thead><tr><th>Customer</th><th>Vehicle</th><th>Service</th><th>Requested</th><th>Status</th><th>Admin action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.customer_name}</td><td className="mono">{r.plate_number}</td><td>{r.service_type}</td>
                  <td className="mono muted">{new Date(r.requested_date).toLocaleString()}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    <select value="" onChange={(e) => e.target.value && setStatus(r.id, e.target.value)}>
                      <option value="">Change status…</option>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  )
}
