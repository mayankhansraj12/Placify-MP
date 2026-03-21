import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FiHome, FiUpload, FiLogOut, FiZap } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-logo">
        <FiZap /> <span>Placify AI</span>
      </Link>

      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>
          <FiHome /> Dashboard
        </Link>
        <Link to="/analyze" className={isActive('/analyze')}>
          <FiUpload /> Analyze
        </Link>
      </div>

      <div className="nav-user">
        <div className="nav-avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <button className="nav-logout" onClick={logout}>
          <FiLogOut style={{ marginRight: 4 }} /> Logout
        </button>
      </div>
    </nav>
  )
}
