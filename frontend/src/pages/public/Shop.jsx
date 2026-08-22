import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Parts as PartsApi, Orders as OrdersApi } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Shop() {
  const { customer } = useAuth()
  const [parts, setParts] = useState([])
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState({}) // part_id -> qty
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { PartsApi.list().then(setParts).catch((e) => setError(e.message)) }, [])

  const filtered = parts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))

  const setQty = (id, qty) => setCart({ ...cart, [id]: qty })

  const placeOrder = async (part) => {
    setError(''); setMessage('')
    if (!customer) { setError('Please log in to order parts.'); return }
    const qty = Number(cart[part.id] || 1)
    try {
      await OrdersApi.create({ customer_id: customer.id, items: [{ part_id: part.id, quantity: qty }] })
      setMessage(`Order submitted for ${qty} × ${part.name}. The garage will confirm availability.`)
      PartsApi.list().then(setParts)
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <section className="section">
        <div className="page-head">
          <div><h1>Spare Parts Shop</h1><p>Order genuine parts online — the workshop confirms stock before it's reserved.</p></div>
        </div>
        {!customer && <div className="notice">You're browsing as a guest. <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link> to place an order.</div>}
        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}
        <div className="field" style={{ maxWidth: 320, marginBottom: 18 }}>
          <label>Search parts</label>
          <input placeholder="Search by name or SKU…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <p className="empty">No parts match your search.</p>
        ) : (
          <div className="product-grid">
            {filtered.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-name">{p.name}</div>
                <div className="product-sku mono">{p.sku}</div>
                <div className="product-price mono">MK {Number(p.unit_price).toLocaleString()}</div>
                <div className={'product-stock ' + (p.quantity <= p.min_stock ? 'low' : '')}>
                  {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                </div>
                <div className="product-actions">
                  <input type="number" min="1" max={p.quantity || 1} disabled={p.quantity === 0}
                    value={cart[p.id] || 1} onChange={(e) => setQty(p.id, e.target.value)} />
                  <button className="amber" disabled={p.quantity === 0} onClick={() => placeOrder(p)}>Order</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
