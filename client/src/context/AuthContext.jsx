import { useCallback, useEffect, useState } from 'react'
import AuthContext from './auth-context'
import api, { clearAccessToken, configureAuthHandlers, setAccessToken } from '../utils/api'

const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('placify_token')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getStoredToken())
  const [loading, setLoading] = useState(true)

  const applySession = useCallback((session) => {
    setAccessToken(session.access_token)
    setToken(session.access_token)
    setUser(session.user)
    return session.access_token
  }, [])

  const clearSession = useCallback(() => {
    clearAccessToken()
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const refreshSession = useCallback(async () => {
    const res = await api.post('/auth/refresh')
    return applySession(res.data)
  }, [applySession])

  useEffect(() => {
    configureAuthHandlers({
      onRefresh: refreshSession,
      onAuthFailure: async () => {
        clearSession()
      },
    })
  }, [refreshSession, clearSession])

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      const storedToken = getStoredToken()

      if (storedToken) {
        setAccessToken(storedToken)
        try {
          const res = await api.get('/auth/me')
          if (cancelled) return
          setToken(storedToken)
          setUser(res.data)
          setLoading(false)
          return
        } catch {
          clearAccessToken()
        }
      }

      try {
        const refreshedToken = await refreshSession()
        if (cancelled) return
        setToken(refreshedToken)
      } catch {
        if (cancelled) return
        clearSession()
        return
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [refreshSession])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    applySession(res.data)
    setLoading(false)
    return res.data.user
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    applySession(res.data)
    setLoading(false)
    return res.data.user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Session cleanup should still happen locally even if the network request fails.
    }
    clearSession()
  }

  const startOAuth = async (provider) => {
    const res = await api.get(`/auth/oauth/${provider}/start`)
    window.location.assign(res.data.url)
  }

  const completeOAuth = async () => {
    const accessToken = await refreshSession()
    setLoading(false)
    return accessToken
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        startOAuth,
        completeOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
