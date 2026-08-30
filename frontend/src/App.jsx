import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import RequireStaff from './components/RequireStaff.jsx'

import Home from './pages/public/Home.jsx'
import Shop from './pages/public/Shop.jsx'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'
import Book from './pages/public/Book.jsx'

import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/Customers.jsx'
import Vehicles from './pages/Vehicles.jsx'
import Appointments from './pages/Appointments.jsx'
import Jobs from './pages/Jobs.jsx'
import Parts from './pages/Parts.jsx'
import Orders from './pages/Orders.jsx'
import Invoices from './pages/Invoices.jsx'
import Mechanics from './pages/Mechanics.jsx'

function Protected({ children }) {
  return <RequireStaff><AdminLayout>{children}</AdminLayout></RequireStaff>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
      <Route path="/book" element={<PublicLayout><Book /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route path="/admin" element={<Protected><Dashboard /></Protected>} />
      <Route path="/admin/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/admin/vehicles" element={<Protected><Vehicles /></Protected>} />
      <Route path="/admin/appointments" element={<Protected><Appointments /></Protected>} />
      <Route path="/admin/jobs" element={<Protected><Jobs /></Protected>} />
      <Route path="/admin/mechanics" element={<Protected><Mechanics /></Protected>} />
      <Route path="/admin/parts" element={<Protected><Parts /></Protected>} />
      <Route path="/admin/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/admin/invoices" element={<Protected><Invoices /></Protected>} />
    </Routes>
  )
}
