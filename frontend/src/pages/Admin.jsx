import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const getActiveTime = (createdAt) => {
  if (!createdAt) return 'N/A'
  const createdDate = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now - createdDate)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffTime / (1000 * 60))
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`
    }
    return `${diffHours} hr${diffHours !== 1 ? 's' : ''}`
  }
  
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365)
    return `${years} yr${years !== 1 ? 's' : ''}`
  }
  
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
}

export default function Admin() {
  const { user, authFetch } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authFetch('/api/auth/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setUsersLoading(false)
      }
    }
    
    if (user && user.email === 'officialtaskora@gmail.com') {
      fetchUsers()
    }
  }, [authFetch, user])

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

      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Broadcast Form */}
        <div className="card" style={{ border: '1px solid var(--border-cyan)', boxShadow: 'var(--cyan-glow)' }}>
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

        {/* Registered Users List */}
        <div className="card" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Registered Directory ({users.length})
          </h3>
          
          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
              Synchronizing User Index...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
              No live users tracked.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map((u) => (
                  <div 
                    key={u.id} 
                    style={{ 
                      padding: '12px 16px', 
                      background: 'var(--glass)', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text1)', fontSize: '1rem' }}>
                      {u.name || 'Anonymous User'}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                      {u.email}
                    </div>
                    {u.created_at && (
                      <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                        <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Active for: {getActiveTime(u.created_at)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
