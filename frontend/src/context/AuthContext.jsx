import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('ug_customer')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (customer) localStorage.setItem('ug_customer', JSON.stringify(customer))
    else localStorage.removeItem('ug_customer')
  }, [customer])

  const login = (data) => setCustomer(data)
  const logout = () => setCustomer(null)

  return (
    <AuthContext.Provider value={{ customer, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
