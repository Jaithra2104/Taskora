import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Live Clock Component ── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', background: 'var(--grad-cyan)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.03em', lineHeight: 1 }}>
        {time}
      </div>
      <div style={{ fontSize: '.85rem', color: 'var(--text2)', marginTop: 6, fontWeight: 600, letterSpacing: '0.02em' }}>{date}</div>
    </div>
  )
}

/* ── Period Countdown ── */
function PeriodCountdown({ start_time, end_time }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const toMin = t => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const cur = now.getHours() * 60 + now.getMinutes()
  const s = toMin(start_time), e = toMin(end_time)
  const fmt = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`

  if (cur < s) return <span className="badge badge-cyan">⏳ Starts in {fmt(s - cur)}</span>
  if (cur >= s && cur < e) return <span className="badge badge-emerald" style={{ animation: 'pulse 2s infinite' }}>⏱ {fmt(e - cur)} left</span>
  return <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text3)' }}>✓ Finished</span>
}

export default function Dashboard() {
  const { authFetch, user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hwModal, setHwModal] = useState(null)
  const [hwForm, setHwForm] = useState({ subject: '', description: '', due_date: '' })
  const [hwSaving, setHwSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/dashboard')
      if (res?.ok) {
        const d = await res.json()
        setData(d)
      } else {
        const d = await res.json()
        setError(d.details || d.error || 'Failed to connect to Taskora Engine')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { load() }, [load])

  const addHWForClass = async (e) => {
    e.preventDefault(); setHwSaving(true)
    await authFetch('/api/homework/', { method: 'POST', body: JSON.stringify(hwForm) })
    setHwSaving(false); setHwModal(null); setHwForm({ subject: '', description: '', due_date: '' }); showToast('Mission added!'); load()
  }

  const openHWModal = (subject) => { setHwForm({ subject, description: '', due_date: '' }); setHwModal(subject) }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="quantum-loader-container">
        <div className="quantum-spinner"></div>
        <div className="quantum-loader-text">WAKING UP TASKORA...</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="icon" style={{ fontSize: '4rem', marginBottom: 20 }}>⚠️</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 10 }}>Sync Failure</h2>
      <p style={{ color: 'var(--rose)', fontSize: '1rem', maxWidth: 500, margin: '0 auto 30px' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); load(); }}>Reconnect to Server</button>
    </div>
  )

  if (!data) return null

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const pendingHW = (data.stats.homework.total || 0) - (data.stats.homework.completed || 0)
  const hwPct = data.stats.homework.total > 0 ? Math.round((data.stats.homework.completed / data.stats.homework.total) * 100) : 0

  const STATS = [
    { label: 'Classes Today', val: data.schedule.length, sub: data.day, icon: '📅', grad: 'var(--grad-cyan)', glow: 'var(--cyan-glow)', path: '/timetable' },
    { label: 'Pending Tasks', val: pendingHW, sub: `${hwPct}% Completed`, icon: '✍️', grad: 'var(--grad-amber)', glow: '0 0 30px rgba(255,184,0,0.3)', path: '/homework' },
    { label: 'Upcoming', val: data.upcoming_assignments.length, sub: 'Deadlines', icon: '🚀', grad: 'var(--grad-purple)', glow: 'var(--purple-glow)', path: '/assignments' },
    { label: 'Certificates', val: data.stats.certificates, sub: 'Achievements', icon: '🏆', grad: 'var(--grad-emerald)', glow: '0 0 30px rgba(16,255,157,0.3)', path: '/certificates' },
  ]

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      {/* ── EXTREME HERO ── */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 32, border: '1px solid var(--border-cyan)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(/auth-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25, filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--bg) 20%, transparent 80%)' }} />
        
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 30 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--cyan-dim)', color: 'var(--cyan)', padding: '6px 14px', borderRadius: 20, fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, border: '1px solid var(--border-cyan)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: 'var(--cyan-glow)' }} />
              System Online
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 12 }}>
              {greeting}, <span style={{ background: 'var(--grad-cyan)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text2)', fontWeight: 500, maxWidth: 500 }}>
              You have <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{data.schedule.length} classes</span> and <span style={{ color: 'var(--amber)', fontWeight: 800 }}>{pendingHW} urgent tasks</span> remaining today.
            </p>
            <div className="flex gap-12 mt-24">
              <button className="btn btn-primary" onClick={() => navigate('/timetable')}>Launch Schedule</button>
              <button className="btn btn-secondary" onClick={() => navigate('/study')}>AI Assistant</button>
            </div>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card" onClick={() => navigate(s.path)} style={{ padding: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '4px', background: s.grad, boxShadow: s.glow }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: s.glow }}>{s.icon}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{s.val}</div>
                <div style={{ fontSize: '.75rem', color: s.grad.includes('cyan') ? 'var(--cyan)' : 'var(--text3)', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text2)', fontWeight: 600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid-2">
        {/* SCHEDULE PANEL */}
        <div className="card" style={{ border: '1px solid var(--border-cyan)' }}>
          <div className="card-header">
            <h3 className="card-title"><span style={{ color: 'var(--cyan)' }}>✦</span> Today's Focus</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/timetable')}>Full Timetable</button>
          </div>
          
          {data.schedule.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏆</div>
              <h3>Free Day!</h3>
              <p>No classes scheduled for today. Time to catch up on projects!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.schedule.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', transition: 'all .2s' }}>
                  <div style={{ width: 50, textAlign: 'center' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--cyan)' }}>{s.start_time.split(':')[0]}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600 }}>{s.start_time.split(':')[1]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.subject}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{s.room ? `📍 ${s.room}` : 'No room assigned'} · {s.start_time} - {s.end_time}</div>
                  </div>
                  <PeriodCountdown start_time={s.start_time} end_time={s.end_time} />
                  <button className="btn-icon" onClick={() => openHWModal(s.subject)} title="Add Homework">+</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TASKS & SYLLABUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-header">
              <h3 className="card-title"><span style={{ color: 'var(--amber)' }}>✎</span> Quick Tasks</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/homework')}>View All</button>
            </div>
            {data.pending_homework.length === 0 ? (
              <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>No pending missions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.pending_homework.slice(0, 3).map(h => (
                  <div key={h.id} style={{ padding: '12px 16px', background: 'rgba(255,184,0,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,184,0,0.1)' }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{h.subject}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: 2 }}>{h.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-header">
              <h3 className="card-title"><span style={{ color: 'var(--emerald)' }}>◉</span> Syllabus Mastery</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/syllabus')}>Full Report</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.syllabus_progress.slice(0, 3).map(s => (
                <div key={s.subject}>
                  <div className="flex-between mb-16" style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{s.subject}</span>
                    <span style={{ fontWeight: 900, fontSize: '.85rem', color: 'var(--emerald)' }}>{s.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${s.progress}%`, background: 'var(--grad-emerald)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {hwModal && (
        <div className="modal-overlay" onClick={() => setHwModal(null)}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ border: '1px solid var(--border-cyan)', boxShadow: 'var(--cyan-glow)' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Assign New Mission</h3>
              <button className="modal-close" onClick={() => setHwModal(null)}>×</button>
            </div>
            <form onSubmit={addHWForClass}>
              <div className="form-group">
                <label className="form-label">Objective Subject</label>
                <input className="form-input" value={hwForm.subject} onChange={e => setHwForm({ ...hwForm, subject: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mission Description</label>
                <textarea className="form-textarea" required value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} placeholder="What is the objective?" />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={hwForm.due_date} onChange={e => setHwForm({ ...hwForm, due_date: e.target.value })} />
              </div>
              <button className="btn btn-primary w-full" disabled={hwSaving} style={{ justifyContent: 'center', marginTop: 16, height: 48, fontSize: '1rem' }}>
                {hwSaving ? 'TRANSMITTING...' : 'INITIALIZE MISSION →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
