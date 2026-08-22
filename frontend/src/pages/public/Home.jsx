import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Parts as PartsApi } from '../../api/client.js'

const STEPS = [
  { n: '01', t: 'Book online', d: 'Create an account, add your vehicle, pick a service and a time.' },
  { n: '02', t: 'We confirm', d: 'The garage confirms your appointment and preps a bay for you.' },
  { n: '03', t: 'Checked in', d: 'Drop the vehicle off — we open a job card and assign a mechanic.' },
  { n: '04', t: 'Approve & collect', d: 'We call if extra work is found. Pay, then collect a serviced vehicle.' },
]

export default function Home() {
  const [parts, setParts] = useState([])

  useEffect(() => { PartsApi.list().then((rows) => setParts(rows.slice(0, 6))).catch(() => {}) }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <div className="eyebrow">Full-service garage &amp; parts counter</div>
          <h1 className="hero-title">Your vehicle,<br />properly job-carded.</h1>
          <p className="hero-sub">
            Book a service, track the job from check-in to collection, and order
            the exact part you need — all from one account.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn amber-link">Create your account</Link>
            <Link to="/shop" className="btn ghost-link">Browse spare parts</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-row"><span>Job status</span><span className="badge in-progress">In Progress</span></div>
          <div className="hero-panel-row"><span>Job #</span><span className="mono">JOB-004821</span></div>
          <div className="hero-panel-row"><span>Mechanic</span><span>Assigned</span></div>
          <div className="hero-panel-row"><span>Parts</span><span>Reserved from stock</span></div>
          <div className="hero-panel-row"><span>Balance</span><span className="mono">MK 0.00</span></div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How it works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head-row">
          <h2 className="section-title">Available parts</h2>
          <Link to="/shop" className="link-more">See full catalog →</Link>
        </div>
        {parts.length === 0 ? (
          <p className="empty">Parts will appear here once the workshop adds inventory.</p>
        ) : (
          <div className="product-grid">
            {parts.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-name">{p.name}</div>
                <div className="product-sku mono">{p.sku}</div>
                <div className="product-price mono">MK {Number(p.unit_price).toLocaleString()}</div>
                <div className={'product-stock ' + (p.quantity <= p.min_stock ? 'low' : '')}>
                  {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
