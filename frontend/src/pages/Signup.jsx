import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { login, API_BASE_URL } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', otp: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1) // 1 = Info, 2 = OTP

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      
      let data;
      try { data = await res.json(); } catch (err) { throw new Error('Unable to connect to server.'); }
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      
      setStep(2) // Move to OTP step
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, otp: form.otp }),
      })
      
      let data;
      try { data = await res.json(); } catch (err) { throw new Error('Unable to connect to server.'); }
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
      <div className="auth-card slide-up">
        <div className="auth-logo-wrap">📘</div>
        <h2>{step === 1 ? 'Create Account' : 'Verify Email'}</h2>
        <p className="subtitle">
          {step === 1 ? 'Start your smart study journey today' : `Enter the 6-digit code sent to ${form.email}`}
        </p>

        {error && <div className="error-msg">⚠ {error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="John Doe" required
                autoComplete="off"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@email.com" required
                autoComplete="off"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" required
                  autoComplete="off"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button 
                  type="button" 
                  className="password-toggle-icon" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-wrapper">
                <input className="form-input" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" required
                  autoComplete="off"
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                <button 
                  type="button" 
                  className="password-toggle-icon" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-full" disabled={loading}
              style={{ justifyContent: 'center', marginTop: 8, padding: '12px' }}>
              {loading ? 'Sending OTP...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="fade-in">
            <div className="form-group">
              <label className="form-label">Verification Code (OTP)</label>
              <input className="form-input" type="text" placeholder="123456" required
                autoComplete="off" maxLength="6"
                style={{ fontSize: '1.5rem', letterSpacing: '0.5em', textAlign: 'center', padding: '16px' }}
                value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}
              style={{ justifyContent: 'center', marginTop: 8, padding: '12px' }}>
              {loading ? 'Verifying...' : 'Create Account'}
            </button>
            <button type="button" className="btn btn-secondary w-full" 
              style={{ justifyContent: 'center', marginTop: 12, padding: '12px' }}
              onClick={() => { setStep(1); setForm({ ...form, otp: '' }); setError(''); }}>
              ← Back
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
