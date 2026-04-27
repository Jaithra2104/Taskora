import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE_URL = "https://taskora-0n0l.onrender.com"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => { setUser(data.user); setLoading(false) })
        .catch(() => { logout(); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (userData, authToken) => {
    localStorage.setItem('token', authToken)
    setToken(authToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const authFetch = async (url, options = {}) => {
    const headers = { ...options.headers, Authorization: `Bearer ${token}` }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
    const res = await fetch(finalUrl, { ...options, headers })
    if (res.status === 401) { logout(); return null }
    return res
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, API_BASE_URL }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
