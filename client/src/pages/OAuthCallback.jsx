import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getAuthErrorMessage } from '../utils/authErrors'

export default function OAuthCallback() {
  const { completeOAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const finalize = async () => {
      try {
        await completeOAuth()
        if (active) {
          navigate('/dashboard', { replace: true })
        }
      } catch (error) {
        const message = getAuthErrorMessage(error, 'OAuth sign-in failed. Please try again.')
        if (active) {
          navigate(`/login?authError=${encodeURIComponent(message)}`, { replace: true })
        }
      }
    }

    finalize()

    return () => {
      active = false
    }
  }, [])

  return <div className="min-h-screen bg-surface" />
}
