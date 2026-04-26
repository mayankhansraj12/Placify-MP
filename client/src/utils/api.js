import axios from 'axios'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const defaultProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${defaultProtocol}://${defaultHost}:5000/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken = typeof window !== 'undefined' ? localStorage.getItem('placify_token') : null
let refreshHandler = null
let authFailureHandler = null
let refreshPromise = null

const isAuthEndpoint = (url = '') => (
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/logout') ||
  url.includes('/auth/oauth/')
)

export function setAccessToken(token) {
  accessToken = token
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('placify_token', token)
    else localStorage.removeItem('placify_token')
  }

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function configureAuthHandlers({ onRefresh, onAuthFailure }) {
  refreshHandler = onRefresh
  authFailureHandler = onAuthFailure
}

if (accessToken) {
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {}
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {}

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error)
    }

    if (isAuthEndpoint(originalRequest.url) || originalRequest._retry || !refreshHandler) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = Promise.resolve(refreshHandler()).finally(() => {
          refreshPromise = null
        })
      }

      const newAccessToken = await refreshPromise
      if (!newAccessToken) {
        throw error
      }

      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      if (authFailureHandler) {
        await authFailureHandler()
      }
      return Promise.reject(refreshError)
    }
  }
)

export default api
