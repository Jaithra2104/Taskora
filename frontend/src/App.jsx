import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Timetable from './pages/Timetable'
import Homework from './pages/Homework'
import Assignments from './pages/Assignments'
import Certificates from './pages/Certificates'
import Syllabus from './pages/Syllabus'
import StudyAssistant from './pages/StudyAssistant'
import Profile from './pages/Profile'
import Games from './pages/Games'
import OAuthCallback from './pages/OAuthCallback'
import Admin from './pages/Admin'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="auth-container">
      <div className="card quantum-loader-container" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div className="quantum-spinner"></div>
        <div className="quantum-loader-text">Initializing...</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function AppRoutes() {
  const { user, loading, token } = useAuth()
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && user.email !== 'officialtaskora@gmail.com' && !localStorage.getItem('review_submitted')) {
      const timer = setTimeout(() => {
        setShowReview(true)
      }, 3 * 60 * 1000) // 3 minutes
      
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? "http://127.0.0.1:5000"
        : "https://taskora-0n0l.onrender.com"

      const res = await fetch(`${API_BASE_URL}/api/auth/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      })
      
      if (res.ok) {
        localStorage.setItem('review_submitted', 'true')
        setShowReview(false)
      }
    } catch (err) {
      console.error("Review error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="auth-container">
      <div className="quantum-loader-container">
        <div className="quantum-spinner"></div>
        <div className="quantum-loader-text">Loading...</div>
      </div>
    </div>
  )

  return (
    <>
      {showReview && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '450px', width: '100%',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 12, 29, 0.95))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '32px', borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: '#FFF', fontSize: '1.5rem', marginBottom: '10px', fontWeight: 800 }}>
              Enjoying Taskora? 📘✨
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Your feedback helps us make the student companion better for everyone!
            </p>
            
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer',
                      color: star <= rating ? 'var(--amber)' : 'rgba(255,255,255,0.2)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    ★
                  </button>
                ))}
              </div>
              
              <textarea
                placeholder="Tell us what you think (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: '12px', color: '#FFF',
                  padding: '12px', fontSize: '0.9rem', marginBottom: '20px', resize: 'none'
                }}
              />
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text2)', padding: '10px 20px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Later
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--gradient-primary)', color: '#FFF',
                    border: 'none', padding: '10px 20px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                    boxShadow: 'var(--neon-glow)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/timetable" element={<ProtectedRoute><AppLayout><Timetable /></AppLayout></ProtectedRoute>} />
        <Route path="/homework" element={<ProtectedRoute><AppLayout><Homework /></AppLayout></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AppLayout><Assignments /></AppLayout></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><AppLayout><Certificates /></AppLayout></ProtectedRoute>} />
        <Route path="/syllabus" element={<ProtectedRoute><AppLayout><Syllabus /></AppLayout></ProtectedRoute>} />
        <Route path="/study" element={<ProtectedRoute><AppLayout><StudyAssistant /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><AppLayout><Games /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
