import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })
  const date = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  return (
    <div style={{ textAlign:'right' }}>
      <div style={{ fontSize:'1.7rem', fontWeight:800, fontVariantNumeric:'tabular-nums', background:'var(--grad-cyan)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.02em', lineHeight:1 }}>
        {time}
      </div>
      <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:4 }}>{date}</div>
    </div>
  )
}

/* ── Period Countdown (updates every 30s) ── */
function PeriodCountdown({ start_time, end_time }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])
  const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m }
  const cur = now.getHours()*60 + now.getMinutes()
  const s = toMin(start_time), e = toMin(end_time)
  const fmt = m => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`

  if (cur < s) return (
    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--cyan)', background:'var(--cyan-dim)', padding:'2px 8px', borderRadius:20 }}>
      ⏳ Starts in {fmt(s-cur)}
    </span>
  )
  if (cur >= s && cur < e) return (
    <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--emerald)', background:'var(--emerald-dim)', padding:'2px 8px', borderRadius:20, animation:'pulse 2s infinite' }}>
      ⏱ {fmt(e-cur)} remaining
    </span>
  )
  return (
    <span style={{ fontSize:'.72rem', fontWeight:600, color:'var(--text3)', background:'rgba(255,255,255,0.04)', padding:'2px 8px', borderRadius:20 }}>
      ✓ Completed
    </span>
  )
}

export default function Dashboard() {
  const { authFetch, user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hwModal, setHwModal] = useState(null) // subject name when open
  const [hwForm, setHwForm] = useState({ subject:'', description:'', due_date:'' })
  const [hwSaving, setHwSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [hwChecks, setHwChecks] = useState({}) // id -> bool local optimistic

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async () => {
    const res = await authFetch('/api/dashboard')
    if (res?.ok) { const d = await res.json(); setData(d) }
    setLoading(false)
  }, [authFetch])

  useEffect(() => { load() }, [load])

  const daysLeft = dateStr => {
    const now = new Date(); now.setHours(0,0,0,0)
    return Math.ceil((new Date(dateStr) - now) / 86400000)
  }

  const toggleHW = async (id, currentStatus) => {
    setHwChecks(p => ({ ...p, [id]: currentStatus === 'pending' }))
    await authFetch(`/api/homework/${id}/toggle`, { method:'PATCH' })
    load()
  }

  const addHWForClass = async (e) => {
    e.preventDefault(); setHwSaving(true)
    await authFetch('/api/homework/', { method:'POST', body:JSON.stringify(hwForm) })
    setHwSaving(false); setHwModal(null); setHwForm({subject:'',description:'',due_date:''}); showToast('Homework added!'); load()
  }

  const openHWModal = (subject) => { setHwForm({ subject, description:'', due_date:'' }); setHwModal(subject) }

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 }}>
      <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid var(--cyan)', borderTopColor:'transparent', animation:'spin .8s linear infinite' }}/>
      <p style={{ color:'var(--text2)', fontSize:'.875rem' }}>Loading your dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!data) return <div className="empty-state"><p>Failed to load</p></div>

  const pendingHW = (data.stats.homework.total||0) - (data.stats.homework.completed||0)
  const hwPct = data.stats.homework.total > 0 ? Math.round((data.stats.homework.completed/data.stats.homework.total)*100) : 0
  const asgPct = data.stats.assignments.total > 0 ? Math.round((data.stats.assignments.completed/data.stats.assignments.total)*100) : 0

  const STATS = [
    { label:'Classes Today',    val:data.schedule.length,             sub:data.day,             icon:'◫', grad:'var(--grad-cyan)',    glow:'rgba(6,182,212,0.12)',    path:'/timetable' },
    { label:'Pending Homework', val:pendingHW,                        sub:`${hwPct}% done`,     icon:'✎', grad:'var(--grad-amber)',   glow:'rgba(245,158,11,0.12)',   path:'/homework' },
    { label:'Deadlines (7d)',   val:data.upcoming_assignments.length, sub:'upcoming',           icon:'⏰', grad:'var(--grad-purple)',  glow:'rgba(139,92,246,0.12)',   path:'/assignments' },
    { label:'Certificates',     val:data.stats.certificates,          sub:'uploaded',           icon:'✦', grad:'var(--grad-emerald)', glow:'rgba(16,185,129,0.12)',   path:'/certificates' },
  ]

  return (
    <div className="fade-in">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      {/* ── Hero Banner ── */}
      <div style={{ background:'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(139,92,246,0.06))', border:'1px solid rgba(6,182,212,0.18)', borderRadius:20, padding:'26px 30px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(6,182,212,0.07)', filter:'blur(50px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(139,92,246,0.07)', filter:'blur(50px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:5 }}>{greeting} 👋</p>
          <h2 style={{ fontSize:'1.9rem', fontWeight:900, letterSpacing:'-.03em', marginBottom:6 }}>
            Hey, <span style={{ background:'var(--grad-cyan)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{user?.name?.split(' ')[0]}</span>!
          </h2>
          <p style={{ color:'var(--text2)', fontSize:'.875rem' }}>
            {data.schedule.length === 0 ? 'No classes today — enjoy your free day! 🎉' : `${data.schedule.length} class${data.schedule.length>1?'es':''} scheduled.`}
            {pendingHW > 0 && <span style={{ color:'var(--amber)' }}> · {pendingHW} homework pending.</span>}
          </p>
          <div className="flex gap-8" style={{ marginTop:14, flexWrap:'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/timetable')}>View Timetable</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/study')}>Study Assistant</button>
          </div>
        </div>
        <div style={{ position:'relative', zIndex:1 }}><LiveClock /></div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card" onClick={() => navigate(s.path)} style={{ '--glow-color':s.glow }}>
            <div className="stat-icon-wrap" style={{ background:s.grad, boxShadow:`0 4px 16px ${s.glow}` }}>
              <span style={{ fontSize:'1.3rem', color:'#000', fontWeight:900 }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bars ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:24 }}>
        {[
          { label:'Homework', pct:hwPct, color:'var(--amber)' },
          { label:'Assignments', pct:asgPct, color:'var(--purple)' },
          ...data.syllabus_progress.slice(0,2).map(s=>({ label:s.subject, pct:s.progress, color:'var(--cyan)', sub:`${s.completed}/${s.total}` })),
        ].map(p => (
          <div key={p.label} className="card" style={{ padding:'12px 16px' }}>
            <div className="flex-between" style={{ marginBottom:7 }}>
              <span style={{ fontSize:'.78rem', fontWeight:700 }}>{p.label}</span>
              <span style={{ fontSize:'.78rem', fontWeight:800, color:p.color }}>{p.pct}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width:`${p.pct}%`, background:p.color }}/>
            </div>
            {p.sub && <div style={{ fontSize:'.67rem', color:'var(--text3)', marginTop:4 }}>{p.sub} topics</div>}
          </div>
        ))}
      </div>

      {/* ── Main panels ── */}
      <div className="grid-2">

        {/* ── TODAY'S SCHEDULE with countdown + homework ── */}
        <div className="card" style={{ gridColumn: data.schedule.length > 0 ? 'span 2' : 'auto' }}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon" style={{ background:'var(--cyan-dim)' }}>◫</div>
              Today's Schedule — {data.day}
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/timetable')}>Manage</button>
          </div>

          {data.schedule.length === 0 ? (
            <div className="empty-state" style={{ padding:'28px 0' }}>
              <div className="icon">🎉</div><h3>No classes today!</h3>
              <button className="btn btn-sm btn-primary" style={{ marginTop:12 }} onClick={() => navigate('/timetable')}>Add Classes</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
              {data.schedule.map((s) => (
                <div key={s.id||s.subject} style={{ background:'rgba(6,182,212,0.05)', border:'1px solid rgba(6,182,212,0.15)', borderRadius:12, padding:'14px 16px' }}>
                  {/* Subject + time */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'.95rem', marginBottom:3 }}>{s.subject}</div>
                      <div style={{ fontSize:'.75rem', color:'var(--text2)' }}>
                        🕐 {s.start_time} – {s.end_time}{s.room ? ` · 📍 ${s.room}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div style={{ marginBottom:10 }}>
                    <PeriodCountdown start_time={s.start_time} end_time={s.end_time} />
                  </div>

                  {/* Quick add homework */}
                  <button
                    onClick={() => openHWModal(s.subject)}
                    style={{ width:'100%', padding:'6px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8, color:'var(--amber)', fontFamily:'var(--font)', fontSize:'.75rem', fontWeight:700, cursor:'pointer', transition:'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(245,158,11,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(245,158,11,0.1)'}
                  >
                    + Add Homework
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PENDING HOMEWORK with checkboxes ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="card-icon" style={{ background:'var(--amber-dim)' }}>✎</div>Homework</div>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/homework')}>View All</button>
          </div>
          {data.pending_homework.length === 0 ? (
            <div className="empty-state" style={{ padding:'28px 0' }}><div className="icon">✅</div><h3>All caught up!</h3></div>
          ) : (
            <div>
              {data.pending_homework.map((h, i) => {
                const checked = hwChecks[h.id] !== undefined ? hwChecks[h.id] : h.status === 'completed'
                return (
                  <div key={h.id} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i < data.pending_homework.length-1 ? '1px solid var(--border)' : 'none', alignItems:'flex-start' }}>
                    {/* Checkbox */}
                    <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', flex:1 }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleHW(h.id, h.status)}
                        style={{ width:17, height:17, marginTop:2, accentColor:'var(--cyan)', flexShrink:0, cursor:'pointer' }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'.875rem', textDecoration:checked?'line-through':'none', color:checked?'var(--text3)':'var(--text)' }}>{h.subject}</div>
                        <div style={{ fontSize:'.75rem', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.description}</div>
                        {h.due_date && <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:2 }}>Due: {h.due_date}</div>}
                      </div>
                    </label>
                  </div>
                )
              })}
              <button className="btn btn-sm btn-primary" style={{ marginTop:14, width:'100%', justifyContent:'center' }} onClick={() => navigate('/homework')}>
                View All Homework →
              </button>
            </div>
          )}
        </div>

        {/* ── UPCOMING ASSIGNMENTS ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="card-icon" style={{ background:'var(--purple-dim)' }}>⏰</div>Deadlines</div>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/assignments')}>View All</button>
          </div>
          {data.upcoming_assignments.length === 0 ? (
            <div className="empty-state" style={{ padding:'28px 0' }}><div className="icon">🎯</div><h3>No upcoming deadlines</h3></div>
          ) : (
            <div>
              {data.upcoming_assignments.map((a, i) => {
                const d = daysLeft(a.due_date)
                const cls = d <= 1 ? 'urgent' : d <= 3 ? 'soon' : 'ok'
                const label = d < 0 ? 'Overdue!' : d === 0 ? 'Due Today!' : d === 1 ? '1 day left' : `${d} days left`
                return (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < data.upcoming_assignments.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: d<=1?'var(--rose)':d<=3?'var(--amber)':'var(--emerald)' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'.875rem' }}>{a.title}</div>
                      <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>{a.subject}</div>
                    </div>
                    <span className={`countdown ${cls}`} style={{ flexShrink:0 }}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── SYLLABUS ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="card-icon" style={{ background:'var(--emerald-dim)' }}>◉</div>Syllabus</div>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/syllabus')}>View All</button>
          </div>
          {data.syllabus_progress.length === 0 ? (
            <div className="empty-state" style={{ padding:'28px 0' }}>
              <div className="icon">📚</div><h3>No subjects tracked</h3>
              <button className="btn btn-sm btn-primary" style={{ marginTop:12 }} onClick={() => navigate('/syllabus')}>Add Subjects</button>
            </div>
          ) : (
            <div>
              {data.syllabus_progress.map((s, i) => {
                const c = s.progress===100 ? 'var(--emerald)' : s.progress>60 ? 'var(--cyan)' : 'var(--purple)'
                return (
                  <div key={s.subject} style={{ padding:'10px 0', borderBottom: i<data.syllabus_progress.length-1?'1px solid var(--border)':'none' }}>
                    <div className="flex-between" style={{ marginBottom:5 }}>
                      <span style={{ fontWeight:700, fontSize:'.875rem' }}>{s.subject}</span>
                      <span style={{ fontSize:'.78rem', fontWeight:800, color:c }}>{s.progress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width:`${s.progress}%`, background:c }}/>
                    </div>
                    <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:4 }}>{s.completed}/{s.total} topics</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card" style={{ marginTop:20 }}>
        <div className="section-title">Quick Actions</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { l:'+ Homework', p:'/homework', c:'var(--amber)' },
            { l:'+ Assignment', p:'/assignments', c:'var(--purple)' },
            { l:'+ Class', p:'/timetable', c:'var(--cyan)' },
            { l:'+ Certificate', p:'/certificates', c:'var(--emerald)' },
            { l:'+ Syllabus', p:'/syllabus', c:'var(--rose)' },
          ].map(q => (
            <button key={q.l} onClick={() => navigate(q.p)}
              style={{ padding:'7px 16px', background:'rgba(255,255,255,0.04)', border:`1px solid ${q.c}33`, borderRadius:10, color:q.c, fontFamily:'var(--font)', fontSize:'.82rem', fontWeight:700, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background=`${q.c}18`; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.transform='none' }}
            >{q.l}</button>
          ))}
        </div>
      </div>

      {/* ── Add Homework Modal (per class) ── */}
      {hwModal && (
        <div className="modal-overlay" onClick={() => setHwModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Add Homework — {hwModal}</h3>
              <button className="modal-close" onClick={() => setHwModal(null)}>×</button>
            </div>
            <form onSubmit={addHWForClass}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" value={hwForm.subject} onChange={e => setHwForm({...hwForm,subject:e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" required value={hwForm.description} onChange={e => setHwForm({...hwForm,description:e.target.value})} placeholder="What needs to be done?"/>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date (optional)</label>
                <input className="form-input" type="date" value={hwForm.due_date} onChange={e => setHwForm({...hwForm,due_date:e.target.value})}/>
              </div>
              <button className="btn btn-primary w-full" disabled={hwSaving} style={{ justifyContent:'center', marginTop:8 }}>
                {hwSaving ? 'Adding...' : 'Add Homework'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
