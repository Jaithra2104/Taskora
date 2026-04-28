import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { user, authFetch } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!user || user.email !== 'officialtaskora@gmail.com') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="error-msg">⚠ Unauthorized Access. Admin only.</div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await authFetch('/api/auth/admin/send-bulk-email', {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast')
      }

      setSuccess(data.message || 'Broadcast sent successfully!')
      setSubject('')
      setBody('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Admin Control Panel</h2>
          <p>Send global email broadcasts to all Taskora users</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid var(--border-cyan)', boxShadow: 'var(--cyan-glow)' }}>
        <h3 className="card-title" style={{ marginBottom: 20, color: 'var(--cyan)' }}>New Email Broadcast</h3>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        {success && (
          <div style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input 
              className="form-input" 
              type="text" 
              placeholder="e.g., Exciting New Features in Taskora! ✨" 
              required 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Body</label>
            <textarea 
              className="form-textarea" 
              style={{ minHeight: '200px' }} 
              placeholder="Type your message here... Tip: Use {{name}} for personalized greetings." 
              required 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
            />
          </div>

          <button 
            className="btn btn-primary w-full" 
            disabled={loading} 
            style={{ justifyContent: 'center', height: 48, fontSize: '1rem', marginTop: 10 }}
          >
            {loading ? 'DISPATCHING BROADCAST...' : '🚀 SEND BROADCAST →'}
          </button>
        </form>
      </div>
    </div>
  )
}
