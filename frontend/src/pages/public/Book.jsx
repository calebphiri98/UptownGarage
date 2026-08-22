import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Vehicles as VehiclesApi, Appointments as AppointmentsApi } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Badge from '../../components/Badge.jsx'

export default function Book() {
  const { customer } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [appointments, setAppointments] = useState([])
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', plate_number: '' })
  const [apptForm, setApptForm] = useState({ vehicle_id: '', service_type: '', requested_date: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadVehicles = () => customer && VehiclesApi.list(customer.id).then(setVehicles)
  const loadAppointments = () => customer && AppointmentsApi.listMine(customer.id).then(setAppointments)

  useEffect(() => { loadVehicles(); loadAppointments() }, [customer])

  const addVehicle = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      await VehiclesApi.create({ ...vehicleForm, customer_id: customer.id })
      setVehicleForm({ make: '', model: '', year: '', plate_number: '' })
      loadVehicles()
    } catch (e) { setError(e.message) }
  }

  const requestAppointment = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      await AppointmentsApi.create({ ...apptForm, customer_id: customer.id })
      setMessage('Appointment requested — the garage will confirm your slot.')
      setApptForm({ vehicle_id: '', service_type: '', requested_date: '' })
      loadAppointments()
    } catch (e) { setError(e.message) }
  }

  if (!customer) {
    return (
      <section className="section auth-section">
        <div className="auth-card">
          <h1>Book a service</h1>
          <p className="muted">Please log in or create an account first — bookings are tied to your vehicle history.</p>
          <div className="hero-actions" style={{ marginTop: 14 }}>
            <Link to="/login" className="btn amber-link">Log in</Link>
            <Link to="/register" className="btn ghost-link">Create account</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="page-head"><div><h1>Book a service</h1><p>Add your vehicle if it's not listed yet, then request a slot.</p></div></div>
      {message && <div className="success-msg">{message}</div>}
      {error && <div className="error-msg">{error}</div>}

      <div className="panel">
        <h2>Your vehicles</h2>
        {vehicles.length === 0 ? <p className="empty">No vehicles on file yet — add one below.</p> : (
          <table>
            <thead><tr><th>Plate</th><th>Make / Model</th><th>Year</th></tr></thead>
            <tbody>{vehicles.map((v) => <tr key={v.id}><td className="mono">{v.plate_number}</td><td>{v.make} {v.model}</td><td>{v.year || '—'}</td></tr>)}</tbody>
          </table>
        )}
        <form className="form-row" onSubmit={addVehicle} style={{ marginTop: 14 }}>
          <div className="field"><label>Make</label><input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></div>
          <div className="field"><label>Model</label><input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
          <div className="field"><label>Year</label><input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })} /></div>
          <div className="field"><label>Plate number</label><input required value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} /></div>
          <button className="ghost" type="submit">Add vehicle</button>
        </form>
      </div>

      <div className="panel">
        <h2>Request an appointment</h2>
        <form className="form-row" onSubmit={requestAppointment}>
          <div className="field"><label>Vehicle</label>
            <select required value={apptForm.vehicle_id} onChange={(e) => setApptForm({ ...apptForm, vehicle_id: e.target.value })}>
              <option value="">Select…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </select>
          </div>
          <div className="field"><label>Service type</label><input required value={apptForm.service_type} onChange={(e) => setApptForm({ ...apptForm, service_type: e.target.value })} /></div>
          <div className="field"><label>Preferred date &amp; time</label><input required type="datetime-local" value={apptForm.requested_date} onChange={(e) => setApptForm({ ...apptForm, requested_date: e.target.value })} /></div>
          <button className="amber" type="submit">Request appointment</button>
        </form>
      </div>

      <div className="panel">
        <h2>Your appointments</h2>
        {appointments.length === 0 ? <p className="empty">No appointments yet.</p> : (
          <table>
            <thead><tr><th>Vehicle</th><th>Service</th><th>Requested</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}><td className="mono">{a.plate_number}</td><td>{a.service_type}</td>
                  <td className="mono muted">{new Date(a.requested_date).toLocaleString()}</td><td><Badge status={a.status} /></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
