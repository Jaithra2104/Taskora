import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="auth-container">
      <div className="quantum-loader-container">
        <div className="quantum-spinner"></div>
        <div className="quantum-loader-text">Loading...</div>
      </div>
    </div>
  )

  return (
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
