import { useEffect, useState } from 'react'
import { Dashboard as DashboardApi } from '../api/client.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    DashboardApi.summary().then(setStats).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Manager Dashboard</h1>
          <p>Live overview across the whole workshop, from booking to collection.</p>
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      {!stats && !error && <p className="empty">Loading…</p>}
      {stats && (
        <div className="stat-grid">
          <div className="stat-card"><div className="num">{stats.customers}</div><div className="label">Customers</div></div>
          <div className="stat-card"><div className="num">{stats.vehicles}</div><div className="label">Vehicles</div></div>
          <div className="stat-card"><div className="num">{stats.pending_appointments}</div><div className="label">Pending Appointments</div></div>
          <div className="stat-card"><div className="num">{stats.active_jobs}</div><div className="label">Active Jobs</div></div>
          <div className="stat-card warn"><div className="num">{stats.jobs_awaiting_approval}</div><div className="label">Awaiting Approval</div></div>
          <div className="stat-card warn"><div className="num">{stats.low_stock_parts}</div><div className="label">Low Stock Parts</div></div>
          <div className="stat-card"><div className="num">{stats.pending_orders}</div><div className="label">Pending Parts Orders</div></div>
          <div className="stat-card warn"><div className="num">{stats.unpaid_invoices}</div><div className="label">Unpaid Invoices</div></div>
          <div className="stat-card"><div className="num">MK {Number(stats.revenue_collected).toLocaleString()}</div><div className="label">Revenue Collected</div></div>
        </div>
      )}
    </>
  )
}
