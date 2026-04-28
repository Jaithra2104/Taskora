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
  const [stats, setStats] = useState({ total_users: 0, total_tasks: 0, total_syllabus: 0, total_reminders: 0, reviews: [] })

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

    const fetchStats = async () => {
      try {
        const res = await authFetch('/api/auth/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    
    if (user) {
      fetchUsers()
      fetchStats()
    }
  }, [authFetch, user])

  if (!user || user.email !== 'officialtaskora@gmail.com') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="error-msg">⚠ Unauthorized Access. Admin privileges required.</div>
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

  const isOnline = (lastActive) => {
    if (!lastActive) return false;
    try {
      let activeDate;
      if (typeof lastActive === 'string') {
        if (lastActive.includes('T')) {
          activeDate = new Date(lastActive);
        } else {
          activeDate = new Date(lastActive.replace(' ', 'T') + 'Z');
        }
      } else {
        activeDate = new Date(lastActive);
      }
      
      if (isNaN(activeDate.getTime())) return false;
      
      const now = new Date();
      const diffMins = Math.abs(now - activeDate) / (1000 * 60);
      return diffMins < 15; // Relax tolerance slightly for background sync gaps
    } catch (err) {
      return false;
    }
  }

  const onlineUsers = users.filter(u => isOnline(u.last_active));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Admin Control Panel</h2>
          <p>System oversight & user engagement dashboard</p>
        </div>
      </div>

      {/* Dashboard Stats Row */}
      <div className="admin-stats-grid" style={{ marginBottom: '40px' }}>
        {/* Total Users */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05), rgba(8, 12, 29, 0.8))', 
          border: '1px solid rgba(0, 242, 254, 0.15)', 
          padding: '24px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ 
            fontSize: '2.2rem', 
            background: 'rgba(0, 242, 254, 0.12)', 
            color: 'var(--cyan)', 
            width: '64px', 
            height: '64px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.15)'
          }}>
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Users</div>
            <div style={{ color: '#FFFFFF', fontSize: '2.2rem', fontWeight: 900, marginTop: '4px', textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>{stats.total_users || users.length}</div>
          </div>
        </div>

        {/* User Reviews */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 255, 157, 0.05), rgba(8, 12, 29, 0.8))', 
          border: '1px solid rgba(16, 255, 157, 0.15)', 
          padding: '24px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ 
            fontSize: '2.2rem', 
            background: 'rgba(16, 255, 157, 0.12)', 
            color: 'var(--emerald)', 
            width: '64px', 
            height: '64px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 255, 157, 0.15)'
          }}>
            <i className="fas fa-star"></i>
          </div>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>User Reviews</div>
            <div style={{ color: '#FFFFFF', fontSize: '2.2rem', fontWeight: 900, marginTop: '4px', textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>{stats.reviews?.length || 0}</div>
          </div>
        </div>

        {/* Broadcast Emails */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.05), rgba(8, 12, 29, 0.8))', 
          border: '1px solid rgba(255, 184, 0, 0.15)', 
          padding: '24px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ 
            fontSize: '2.2rem', 
            background: 'rgba(255, 184, 0, 0.12)', 
            color: 'var(--amber)', 
            width: '64px', 
            height: '64px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255, 184, 0, 0.15)'
          }}>
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sent Emails</div>
            <div style={{ color: '#FFFFFF', fontSize: '2.2rem', fontWeight: 900, marginTop: '4px', textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>{stats.total_emails_sent || 0}</div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(191, 119, 255, 0.05), rgba(8, 12, 29, 0.8))', 
          border: '1px solid rgba(191, 119, 255, 0.15)', 
          padding: '24px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ 
            fontSize: '2.2rem', 
            background: 'rgba(191, 119, 255, 0.12)', 
            color: 'var(--purple)', 
            width: '64px', 
            height: '64px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(191, 119, 255, 0.15)'
          }}>
            <i className="fas fa-chart-line"></i>
          </div>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project Analytics</div>
            <div style={{ color: 'var(--text1)', fontSize: '0.95rem', fontWeight: 700, marginTop: '6px' }}>
              Tasks: <strong style={{ color: 'var(--cyan)' }}>{stats.total_tasks || 0}</strong>
            </div>
            <div style={{ color: 'var(--text1)', fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
              Topics: <strong style={{ color: 'var(--purple)' }}>{stats.total_syllabus || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

          {/* Reviews Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>User Reviews ({stats.reviews?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.reviews?.map(r => (
                <div key={r.id} style={{ padding: '12px 16px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text1)' }}>{r.name}</span>
                    <span style={{ color: '#FBBF24' }}>{'★'.repeat(r.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '0.9rem', fontStyle: 'italic' }}>"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Live / Active Users List */}
          <div className="card" style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ marginBottom: 16, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 8px var(--emerald)' }} />
              Live / Active Users ({onlineUsers.length})
            </h3>
            
            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
                Synchronizing User Index...
              </div>
            ) : onlineUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontStyle: 'italic' }}>
                No users currently online.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {onlineUsers.map((u) => (
                    <div 
                      key={u.id} 
                      className="admin-user-row"
                      style={{ 
                        padding: '12px 16px', 
                        background: 'rgba(16, 185, 129, 0.05)', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text1)', fontSize: '1rem' }}>{u.name || 'Anonymous User'}</div>
                        <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{u.email}</div>
                      </div>
                      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--emerald)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        ONLINE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Complete User Directory */}
          <div className="card" style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>
              Full User Directory ({users.length})
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
                  {users.map((u) => {
                    const online = isOnline(u.last_active);
                    return (
                      <div 
                        key={u.id} 
                        className="admin-user-row"
                        style={{ 
                          padding: '12px 16px', 
                          background: 'var(--glass)', 
                          borderRadius: '10px', 
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text1)', fontSize: '1rem' }}>
                            {u.name || 'Anonymous User'}
                          </div>
                          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                            {u.email}
                          </div>
                          {u.created_at && (
                            <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: '4px' }}>
                              Joined: {new Date(u.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span style={{
                          color: online ? 'var(--emerald)' : 'var(--text3)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: online ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: online ? 'var(--emerald)' : '#9CA3AF',
                            boxShadow: online ? '0 0 8px var(--emerald)' : 'none'
                          }} />
                          {online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
