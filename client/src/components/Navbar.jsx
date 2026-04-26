import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/ThemeContext'
import { LayoutDashboard, Upload, LogOut, ChevronDown, Sun, Moon } from 'lucide-react'
import { cn } from '../lib/utils'
import logo from '../assets/logo.png'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const isDark = theme === 'dark'
  const isActive = (path) => location.pathname === path
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }
  const initial = user.name?.charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Frosted glass navbar — inline style changes for dark mode */}
      <div style={{
        background: isDark ? 'rgba(15,12,8,0.92)' : 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: isDark ? '0 1px 20px rgba(0,0,0,0.30)' : '0 1px 20px rgba(0,0,0,0.05)',
      }}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline group">
            <img src={logo} alt="Placify AI" className="h-7 w-auto transition-all group-hover:scale-105 dark:brightness-0 dark:invert" />
            <span className="font-display font-extrabold text-sm text-[#111111] dark:text-stone-100 tracking-tight">Placify AI</span>
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
                    ? 'bg-[rgba(0,0,0,0.08)] text-[#111111] dark:bg-white/10 dark:text-stone-100'
                    : 'text-[rgba(0,0,0,0.40)] hover:text-[#111111] hover:bg-[rgba(0,0,0,0.05)] dark:text-stone-500 dark:hover:text-stone-100 dark:hover:bg-white/10'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-white/10 transition-all cursor-pointer">

              {/* Avatar with provider badge */}
              <div className="relative">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#111111' }}>
                  {initial}
                </div>
                {user.auth_methods?.includes('google') && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5">
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </span>
                )}
                {user.auth_methods?.includes('github') && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#24292e] flex items-center justify-center shadow-sm border border-black/5">
                    <svg viewBox="0 0 24 24" className="w-2 h-2" fill="white">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold text-[#111111] dark:text-stone-100 hidden sm:block">{user.name?.split(' ')[0]}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[rgba(0,0,0,0.25)] dark:text-stone-500 transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 rounded-2xl overflow-hidden"
                  style={{
                    minWidth: '260px',
                    background: isDark ? 'rgba(20,17,13,0.97)' : 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(20px)',
                    border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.50)' : '0 12px 40px rgba(0,0,0,0.12)',
                  }}>

                  {/* User info header */}
                  <div className="px-4 py-3.5 border-b border-[rgba(0,0,0,0.06)] dark:border-white/10">
                    <div className="flex items-center gap-3">
                      {/* Large avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white font-bold text-sm">
                          {initial}
                        </div>
                        {user.auth_methods?.includes('google') && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow border border-black/5">
                            <svg viewBox="0 0 24 24" className="w-3 h-3">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </span>
                        )}
                        {user.auth_methods?.includes('github') && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#24292e] flex items-center justify-center shadow border border-black/5">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="white">
                              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Name + email */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111111] dark:text-stone-100 leading-tight">{user.name}</p>
                        <p className="text-[11px] text-[rgba(0,0,0,0.45)] dark:text-stone-500 leading-tight mt-0.5 break-all">{user.email}</p>
                      </div>
                    </div>

                    {/* Provider pill */}
                    {user.auth_methods?.includes('google') && (
                      <div className="mt-3 flex items-center gap-1.5 bg-[#f1f3f4] dark:bg-white/10 rounded-full px-2.5 py-1 w-fit">
                        <svg viewBox="0 0 24 24" className="w-3 h-3">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-[10px] font-semibold text-[#3c4043] dark:text-stone-300">Google Account</span>
                      </div>
                    )}
                    {user.auth_methods?.includes('github') && (
                      <div className="mt-3 flex items-center gap-1.5 bg-[#f6f8fa] dark:bg-white/10 rounded-full px-2.5 py-1 w-fit border border-[rgba(0,0,0,0.08)] dark:border-white/10">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill={isDark ? '#f0ebe4' : '#24292e'}>
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                        </svg>
                        <span className="text-[10px] font-semibold text-[#24292e] dark:text-stone-300">GitHub Account</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    {/* Theme toggle */}
                    <button onClick={toggleTheme}
                      className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-xs text-on-surface-variant dark:text-stone-400 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-white/10 transition-all cursor-pointer font-medium">
                      <div className="flex items-center gap-2.5">
                        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        <span>Appearance</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)', color: isDark ? '#f0ebe4' : '#111111' }}>
                        {isDark ? 'Dark' : 'Light'}
                      </div>
                    </button>

                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-on-surface-variant dark:text-stone-400 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-white/10 transition-all cursor-pointer font-medium">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
