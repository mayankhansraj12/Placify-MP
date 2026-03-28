import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LayoutDashboard, Zap, Upload, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import logo from '../assets/logo.png'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const isActive = (path) => location.pathname === path
  const handleLogout = () => { logout(); navigate('/') }
  const initial = user.name?.charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Frosted glass navbar matching the gradient bg */}
      <div style={{
        background: 'rgba(242,253,255,0.80)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 20px rgba(0,0,0,0.05)',
      }}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline group">
            <img src={logo} alt="Placify AI" className="h-7 w-auto transition-all group-hover:scale-105" />
            <span className="font-display font-extrabold text-sm text-[#111111] tracking-tight">Placify AI</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {[
              { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/analyze',   icon: Upload,          label: 'Analyze'   },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold no-underline transition-all',
                  isActive(to)
                    ? 'bg-[rgba(0,0,0,0.08)] text-[#111111]'
                    : 'text-[rgba(0,0,0,0.40)] hover:text-[#111111] hover:bg-[rgba(0,0,0,0.05)]'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[rgba(0,0,0,0.05)] transition-all cursor-pointer">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#111111' }}>
                {initial}
              </div>
              <span className="text-xs font-semibold text-[#111111] hidden sm:block">{user.name?.split(' ')[0]}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[rgba(0,0,0,0.25)] transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl py-1.5 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
                  <div className="px-3.5 py-2 border-b border-[rgba(0,0,0,0.05)] mb-1">
                    <p className="text-[10px] text-[rgba(0,0,0,0.30)] font-medium">Signed in as</p>
                    <p className="text-xs font-semibold text-[#111111] truncate">{user.email}</p>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-on-surface-variant hover:bg-primary-container/10 transition-all cursor-pointer font-medium">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
