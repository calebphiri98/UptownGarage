import { useEffect, useState } from 'react'
import { Parts as PartsApi } from '../api/client.js'
import Panel from '../components/Panel.jsx'

export default function Parts() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', sku: '', quantity: 0, min_stock: 0, unit_price: 0 })
  const [stockIn, setStockIn] = useState({})
  const [error, setError] = useState('')

  const load = () => PartsApi.list().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try { await PartsApi.create(form); setForm({ name: '', sku: '', quantity: 0, min_stock: 0, unit_price: 0 }); load() }
    catch (e) { setError(e.message) }
  }

  const receiveStock = async (id) => {
    setError('')
    const qty = Number(stockIn[id] || 0)
    if (!qty) return
    try { await PartsApi.stockIn(id, { quantity: qty, reason: 'Stock received' }); setStockIn({ ...stockIn, [id]: '' }); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-head"><div><h1>Parts Inventory</h1><p>Stock should never change without a recorded reason for the movement.</p></div></div>
      {error && <div className="error-msg">{error}</div>}
      <Panel title="Add a new part">
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>SKU</label><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div className="field"><label>Opening qty</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="field"><label>Min stock</label><input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
          <div className="field"><label>Unit price</label><input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
          <button className="amber" type="submit">Add part</button>
        </form>
      </Panel>
      <Panel title={`Inventory (${rows.length})`}>
        {rows.length === 0 ? <p className="empty">No parts yet.</p> : (
          <table>
            <thead><tr><th>Part</th><th>SKU</th><th>Qty</th><th>Min</th><th>Price</th><th>Receive stock</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td><td className="mono">{r.sku}</td>
                  <td className={r.quantity <= r.min_stock ? 'mono' : 'mono'} style={r.quantity <= r.min_stock ? { color: 'var(--bad)', fontWeight: 700 } : {}}>{r.quantity}</td>
                  <td className="mono muted">{r.min_stock}</td><td className="mono">MK {Number(r.unit_price).toLocaleString()}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <input type="number" min="1" style={{ width: 70 }} value={stockIn[r.id] || ''} onChange={(e) => setStockIn({ ...stockIn, [r.id]: e.target.value })} />
                    <button className="ghost" type="button" onClick={() => receiveStock(r.id)}>Receive</button>
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
