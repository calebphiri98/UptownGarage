import { createContext, useContext, useEffect, useState } from 'react'
import { StaffAuth } from '../api/client.js'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    return StaffAuth.me().then((res) => setStaff(res.staff)).catch(() => setStaff(null))
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await StaffAuth.login(email, password)
    setStaff(res.staff)
    return res.staff
  }

  const logout = async () => {
    await StaffAuth.logout().catch(() => {})
    setStaff(null)
  }

  return (
    <StaffAuthContext.Provider value={{ staff, loading, login, logout, refresh, setStaff }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  return useContext(StaffAuthContext)
}
