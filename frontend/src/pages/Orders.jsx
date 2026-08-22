import { useEffect, useState } from 'react'
import { Orders as OrdersApi, Customers as CustomersApi, Parts as PartsApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'
import Badge from '../components/Badge.jsx'

export default function Orders() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [parts, setParts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [cart, setCart] = useState([{ part_id: '', quantity: 1 }])
  const [error, setError] = useState('')

  const load = () => OrdersApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load(); CustomersApi.list().then(setCustomers); PartsApi.list().then(setParts) }, [])

  const updateCartRow = (i, field, value) => {
    const next = [...cart]; next[i] = { ...next[i], [field]: value }; setCart(next)
  }
  const addRow = () => setCart([...cart, { part_id: '', quantity: 1 }])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const items = cart.filter((c) => c.part_id).map((c) => ({ part_id: c.part_id, quantity: Number(c.quantity) }))
      if (!items.length) { setError('Add at least one part to the order'); return }
      await OrdersApi.create({ customer_id: customerId || null, items })
      setCart([{ part_id: '', quantity: 1 }]); setCustomerId('')
      load()
    } catch (e) { setError(e.message) }
  }

  const confirm = async (id) => { setError(''); try { await OrdersApi.confirm(id); load(); PartsApi.list().then(setParts) } catch (e) { setError(e.message) } }
  const reject = async (id) => { setError(''); try { await OrdersApi.reject(id); load() } catch (e) { setError(e.message) } }

  return (
    <>
      <div className="page-head"><div><h1>Spare Parts Orders</h1><p>An order cannot be confirmed for more quantity than is available in stock.</p></div></div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Submit an order">
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field"><label>Customer (optional)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in / none</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {cart.map((row, i) => (
            <div className="form-row" key={i}>
              <div className="field"><label>Part</label>
                <select value={row.part_id} onChange={(e) => updateCartRow(i, 'part_id', e.target.value)}>
                  <option value="">Select part…</option>{parts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
                </select>
              </div>
              <div className="field"><label>Quantity</label><input type="number" min="1" value={row.quantity} onChange={(e) => updateCartRow(i, 'quantity', e.target.value)} /></div>
            </div>
          ))}
          <div className="form-row" style={{ marginTop: 6 }}>
            <button type="button" className="ghost" onClick={addRow}>+ Add another part</button>
            <button className="amber" type="submit">Submit order</button>
          </div>
        </form>
      </Panel>
      <Panel title={`Orders (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No orders yet.</p> : (
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Status</th><th>Submitted</th><th>Admin action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td><td>{r.customer_name || 'Walk-in'}</td><td><Badge status={r.status} /></td>
                  <td className="mono muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="ghost" onClick={() => confirm(r.id)}>Confirm</button>
                        <button className="ghost" onClick={() => reject(r.id)}>Reject</button>
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
