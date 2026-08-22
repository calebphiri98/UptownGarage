import { useEffect, useState } from 'react'
import { Invoices as InvoicesApi, Jobs as JobsApi, Orders as OrdersApi, Payments as PaymentsApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'
import Badge from '../components/Badge.jsx'

export default function Invoices() {
  const [rows, setRows] = useState([])
  const [jobs, setJobs] = useState([])
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState({ job_id: '', order_id: '', labor_charge: 0, discount: 0 })
  const [payment, setPayment] = useState({})
  const [error, setError] = useState('')

  const load = () => InvoicesApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load(); JobsApi.list().then(setJobs); OrdersApi.list().then(setOrders) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await InvoicesApi.create({
        job_id: form.job_id || null, order_id: form.order_id || null,
        labor_charge: Number(form.labor_charge), discount: Number(form.discount),
      })
      setForm({ job_id: '', order_id: '', labor_charge: 0, discount: 0 })
      load()
    } catch (e) { setError(e.message) }
  }

  const recordPayment = async (id) => {
    setError('')
    const amount = Number(payment[id] || 0)
    if (!amount) return
    try { await PaymentsApi.create({ invoice_id: id, amount, method: 'cash' }); setPayment({ ...payment, [id]: '' }); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head"><div><h1>Invoices &amp; Payments</h1><p>Total = labour + parts − approved discounts. Balance = total − amount paid.</p></div></div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Generate invoice">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>From job</label>
            <select value={form.job_id} onChange={(e) => setForm({ ...form, job_id: e.target.value, order_id: '' })}>
              <option value="">None</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.job_number} — {j.plate_number}</option>)}
            </select>
          </div>
          <div className="field"><label>Or from order</label>
            <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value, job_id: '' })}>
              <option value="">None</option>{orders.map((o) => <option key={o.id} value={o.id}>Order #{o.id} — {o.customer_name || 'Walk-in'}</option>)}
            </select>
          </div>
          <div className="field"><label>Labour charge</label><input type="number" step="0.01" value={form.labor_charge} onChange={(e) => setForm({ ...form, labor_charge: e.target.value })} /></div>
          <div className="field"><label>Discount</label><input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
          <button className="amber" type="submit">Generate</button>
        </form>
      </Panel>
      <Panel title={`Invoices (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No invoices yet.</p> : (
          <table>
            <thead><tr><th>#</th><th>Source</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Record payment</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td className="mono muted">{r.job_id ? `Job #${r.job_id}` : `Order #${r.order_id}`}</td>
                  <td className="mono">MK {Number(r.total).toLocaleString()}</td>
                  <td className="mono">MK {Number(r.amount_paid).toLocaleString()}</td>
                  <td className="mono">MK {Number(r.balance).toLocaleString()}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    {r.balance > 0 && r.status !== 'Cancelled' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="number" step="0.01" min="0" style={{ width: 90 }} value={payment[r.id] || ''} onChange={(e) => setPayment({ ...payment, [r.id]: e.target.value })} />
                        <button className="ghost" type="button" onClick={() => recordPayment(r.id)}>Pay</button>
                      </div>
                    )}
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
