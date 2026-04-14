import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthCallback from './pages/OAuthCallback'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import Results from './pages/Results'
import { useAuth } from './context/useAuth'

export default function App() {
  const { user } = useAuth()

  return (
    <>
      {/* App Navbar only shows on protected pages */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>
        } />
        <Route path="/analyze" element={
          <ProtectedRoute><Navbar /><Analyze /></ProtectedRoute>
        } />
        <Route path="/results/:id" element={
          <ProtectedRoute><Navbar /><Results /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  )
}
