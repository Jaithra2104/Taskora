import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, API_BASE_URL } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Unable to connect to the backend server. Is it running?');
      }

      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-card slide-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="icon-cycle">
            <span className="icon-item">🖋️</span>
            <span className="icon-item">📅</span>
            <span className="icon-item">🏅</span>
          </div>
        </div>

        <div className="auth-logo-wrap">📘</div>
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to Taskora</p>

        {error && <div className="error-msg">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <input
              type="email"
              className="form-input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <label>Email Address</label>
          </div>

          <div className="auth-input-group">
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <label>Password</label>
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent: 'center', height: 46 }} disabled={loading}>
            {loading ? (
              <div className="book-loader">
                <div className="book-back"></div>
                <div className="book-page"></div>
              </div>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}
