import { useEffect, useState } from 'react'
import AuthContext from './auth-context'
import api from '../utils/api'

const initialToken = localStorage.getItem('placify_token')

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(Boolean(initialToken))

  useEffect(() => {
    if (!token) {
      delete api.defaults.headers.common.Authorization
      return
    }

    let cancelled = false
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    api.get('/auth/me')
      .then((res) => {
        if (cancelled) return
        setUser(res.data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('placify_token')
        delete api.defaults.headers.common.Authorization
        setToken(null)
        setUser(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('placify_token', access_token)
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`
    setToken(access_token)
    setUser(userData)
    setLoading(false)
    return userData
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('placify_token', access_token)
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`
    setToken(access_token)
    setUser(userData)
    setLoading(false)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('placify_token')
    delete api.defaults.headers.common.Authorization
    setToken(null)
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
