import { useEffect, useState } from 'react'
import { Jobs as JobsApi, Customers as CustomersApi, Vehicles as VehiclesApi, Mechanics as MechanicsApi, Parts as PartsApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'
import Badge from '../components/Badge.jsx'

const STATUSES = ['Booked','Vehicle Checked In','Inspection','Awaiting Approval','Approved',
  'In Progress','Waiting for Parts','Completed','Ready for Collection','Collected']

export default function Jobs() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [parts, setParts] = useState([])
  const [form, setForm] = useState({ customer_id: '', vehicle_id: '', mechanic_id: '', reported_problem: '' })
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState({ diagnosis: '', work_performed: '', completion_notes: '', status: '', mechanic_id: '' })
  const [issue, setIssue] = useState({ part_id: '', quantity: '' })
  const [error, setError] = useState('')

  const load = () => JobsApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => {
    load()
    CustomersApi.list().then(setCustomers)
    VehiclesApi.list().then(setVehicles)
    MechanicsApi.list().then(setMechanics)
    PartsApi.list().then(setParts)
  }, [])

  const createJob = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await JobsApi.create(form)
      setForm({ customer_id: '', vehicle_id: '', mechanic_id: '', reported_problem: '' })
      load()
    } catch (e) { setError(e.message) }
  }

  const openJob = (job) => {
    setSelected(job)
    setDetail({
      diagnosis: job.diagnosis || '', work_performed: job.work_performed || '',
      completion_notes: job.completion_notes || '', status: job.status, mechanic_id: job.mechanic_id || '',
    })
    setIssue({ part_id: '', quantity: '' })
  }

  const saveDetail = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await JobsApi.update(selected.id, detail)
      load()
      setSelected(null)
    } catch (e) { setError(e.message) }
  }

  const issuePart = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await JobsApi.issuePart(selected.id, issue)
      setIssue({ part_id: '', quantity: '' })
      PartsApi.list().then(setParts)
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Job Cards</h1><p>The job card is the central record linking customer, vehicle, mechanic, diagnosis, parts and invoice.</p></div>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <Panel title="Open a job card (vehicle check-in)">
        <form className="form-row" onSubmit={createJob}>
          <div className="field"><label>Customer</label>
            <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select…</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Vehicle</label>
            <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </select>
          </div>
          <div className="field"><label>Assign mechanic</label>
            <select value={form.mechanic_id} onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })}>
              <option value="">Unassigned</option>{mechanics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flexBasis: '100%' }}><label>Reported problem</label>
            <textarea required value={form.reported_problem} onChange={(e) => setForm({ ...form, reported_problem: e.target.value })} />
          </div>
          <button className="amber" type="submit">Create job card</button>
        </form>
      </Panel>

      <Panel title={`All jobs (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No jobs yet.</p> : (
          <table>
            <thead><tr><th>Job #</th><th>Vehicle</th><th>Customer</th><th>Mechanic</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.job_number}</td><td className="mono">{r.plate_number}</td>
                  <td>{r.customer_name}</td><td>{r.mechanic_name || '—'}</td><td><Badge status={r.status} /></td>
                  <td><button className="ghost" onClick={() => openJob(r)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {selected && (
        <Panel title={`Job ${selected.job_number} — ${selected.plate_number}`}>
          <p className="muted" style={{ marginTop: -6 }}>Reported: {selected.reported_problem}</p>
          <form className="form-row" onSubmit={saveDetail}>
            <div className="field"><label>Mechanic</label>
              <select value={detail.mechanic_id} onChange={(e) => setDetail({ ...detail, mechanic_id: e.target.value })}>
                <option value="">Unassigned</option>{mechanics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Status</label>
              <select value={detail.status} onChange={(e) => setDetail({ ...detail, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field" style={{ flexBasis: '100%' }}><label>Diagnosis</label>
              <textarea value={detail.diagnosis} onChange={(e) => setDetail({ ...detail, diagnosis: e.target.value })} />
            </div>
            <div className="field" style={{ flexBasis: '100%' }}><label>Work performed</label>
              <textarea value={detail.work_performed} onChange={(e) => setDetail({ ...detail, work_performed: e.target.value })} />
            </div>
            <div className="field" style={{ flexBasis: '100%' }}><label>Completion notes</label>
              <textarea value={detail.completion_notes} onChange={(e) => setDetail({ ...detail, completion_notes: e.target.value })} />
            </div>
            <button className="amber" type="submit">Save job</button>
            <button type="button" className="ghost" onClick={() => setSelected(null)}>Close</button>
          </form>

          <h2 style={{ marginTop: 22 }}>Issue a part to this job</h2>
          <form className="form-row" onSubmit={issuePart}>
            <div className="field"><label>Part</label>
              <select required value={issue.part_id} onChange={(e) => setIssue({ ...issue, part_id: e.target.value })}>
                <option value="">Select…</option>
                {parts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
              </select>
            </div>
            <div className="field"><label>Quantity</label><input required type="number" min="1" value={issue.quantity} onChange={(e) => setIssue({ ...issue, quantity: e.target.value })} /></div>
            <button type="submit">Issue part</button>
          </form>
        </Panel>
      )}
    </>
  )
}
