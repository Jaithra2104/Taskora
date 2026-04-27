import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { login, API_BASE_URL } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Unable to connect to the backend server. Is it running?');
      }

      if (!res.ok) throw new Error(data.error || 'Signup failed')
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
        <h2>Create Account</h2>
        <p className="subtitle">Start your Taskora journey today</p>

        {error && <div className="error-msg">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <label>Full Name</label>
          </div>

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

          <div className="auth-input-group">
            <input
              type="password"
              className="form-input"
              placeholder="Confirm"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
            <label>Confirm Password</label>
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent: 'center', height: 46 }} disabled={loading}>
            {loading ? (
              <div className="book-loader">
                <div className="book-back"></div>
                <div className="book-page"></div>
              </div>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
