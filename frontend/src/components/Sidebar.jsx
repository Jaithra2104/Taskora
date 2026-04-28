import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { path: '/', label: 'Dashboard', icon: 'fa-house' },
  { path: '/timetable', label: 'Timetable', icon: 'fa-calendar-days' },
  { path: '/homework', label: 'Homework', icon: 'fa-book-open' },
  { path: '/assignments', label: 'Assignments', icon: 'fa-clock' },
  { path: '/certificates', label: 'Certificates', icon: 'fa-award' },
  { path: '/syllabus', label: 'Syllabus', icon: 'fa-scroll' },
  { path: '/study', label: 'Study Assistant', icon: 'fa-brain' },
  { path: '/games', label: 'Arcade', icon: 'fa-gamepad' },
  { path: '/profile', label: 'My Profile', icon: 'fa-user-astronaut' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const go = (path) => { navigate(path); setOpen(false) }
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const navItems = [...NAV]
  if (user?.email === 'officialtaskora@gmail.com') {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: 'fa-user-shield' })
  }

  return (
    <>
      {/* Mobile header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(true)}>☰</button>
        <span style={{ fontWeight: 800, fontSize: '.95rem', background: 'var(--grad-cyan)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TASKORA</span>
        <div style={{ width: 36 }} />
      </div>

      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">📘</div>
          <div>
            <h1>Taskora</h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => go(item.path)}
            >
              <span className="nav-icon"><i className={`fas ${item.icon}`}></i></span>
              {item.label}
              {location.pathname === item.path && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-chip" onClick={() => navigate('/profile')} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={logout} style={{ color: 'var(--rose)', width: '100%' }}>
            <span className="nav-icon">⇠</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
