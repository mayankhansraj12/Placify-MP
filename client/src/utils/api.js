import axios from 'axios'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const defaultProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${defaultProtocol}://${defaultHost}:5000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token from localStorage on init
const token = localStorage.getItem('placify_token')
if (token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Response interceptor for auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('placify_token')
      delete api.defaults.headers.common.Authorization
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
