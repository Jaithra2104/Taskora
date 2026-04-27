import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const EMPTY = { day:'Monday', subject:'', start_time:'', end_time:'', room:'' }
const DAY_COLOR = {
  Monday:    { accent:'#06b6d4', dim:'rgba(6,182,212,0.12)',    border:'rgba(6,182,212,0.3)' },
  Tuesday:   { accent:'#8b5cf6', dim:'rgba(139,92,246,0.12)',   border:'rgba(139,92,246,0.3)' },
  Wednesday: { accent:'#10b981', dim:'rgba(16,185,129,0.12)',   border:'rgba(16,185,129,0.3)' },
  Thursday:  { accent:'#f59e0b', dim:'rgba(245,158,11,0.12)',   border:'rgba(245,158,11,0.3)' },
  Friday:    { accent:'#f43f5e', dim:'rgba(244,63,94,0.12)',    border:'rgba(244,63,94,0.3)' },
  Saturday:  { accent:'#a78bfa', dim:'rgba(167,139,250,0.12)',  border:'rgba(167,139,250,0.3)' },
}

function fmt12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
}

function PeriodStatus({ start_time, end_time }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const toMin = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m }
  const cur = now.getHours()*60 + now.getMinutes()
  const s = toMin(start_time), e = toMin(end_time)

  if (cur < s) {
    const diff = s - cur
    return <span style={{ fontSize:'.65rem', color:'#06b6d4' }}>Starts in {diff < 60 ? `${diff}m` : `${Math.floor(diff/60)}h ${diff%60}m`}</span>
  }
  if (cur >= s && cur < e) {
    const left = e - cur
    return <span style={{ fontSize:'.65rem', color:'#10b981', fontWeight:700 }}>⏱ {left}m left</span>
  }
  return <span style={{ fontSize:'.65rem', color:'var(--text3)' }}>Done</span>
}

export default function Timetable() {
  const { authFetch } = useAuth()
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [view, setView] = useState('grid') // 'grid' | 'list'
  const [activeDay, setActiveDay] = useState(() => new Date().toLocaleDateString('en-US',{weekday:'long'}))
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await authFetch('/api/timetable/')
    if (res?.ok) { const d = await res.json(); setEntries(d.timetable) }
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }
  const openAdd  = ()  => { setEditEntry(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (e) => { setEditEntry(e); setForm({day:e.day,subject:e.subject,start_time:e.start_time,end_time:e.end_time,room:e.room||''}); setShowModal(true) }

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setSaving(true)
    try {
      const res = editEntry
        ? await authFetch(`/api/timetable/${editEntry.id}`,{method:'PUT',body:JSON.stringify(form)})
        : await authFetch('/api/timetable/',{method:'POST',body:JSON.stringify(form)})
      if (res?.ok) { showToast(editEntry?'Updated!':'Added!'); setShowModal(false); setForm(EMPTY); setEditEntry(null); load() }
      else { const d=await res?.json(); showToast(d?.error||'Error','error') }
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this class?')) return
    await authFetch(`/api/timetable/${id}`,{method:'DELETE'}); showToast('Deleted'); load()
  }

  const handleCSV = async (e) => {
    const file = e.target.files[0]; if(!file) return
    const fd = new FormData(); fd.append('file',file)
    const res = await authFetch('/api/timetable/upload-csv',{method:'POST',body:fd})
    if(res?.ok){const d=await res.json();showToast(d.message);load()}
    else showToast('CSV failed','error')
    fileRef.current.value=''
  }

  const grouped = DAYS.reduce((acc,day)=>{
    acc[day]=entries.filter(e=>e.day===day).sort((a,b)=>a.start_time.localeCompare(b.start_time))
    return acc
  },{})

  const today = new Date().toLocaleDateString('en-US',{weekday:'long'})

  return (
    <div className="fade-in">
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>◫ &nbsp;Timetable</h2>
          <p>{entries.length} classes · {DAYS.filter(d=>grouped[d].length>0).length} days active</p>
        </div>
        <div className="flex gap-8" style={{flexWrap:'wrap'}}>
          <input type="file" accept=".csv" ref={fileRef} onChange={handleCSV} style={{display:'none'}} />
          <div className="flex gap-8" style={{background:'var(--glass)',border:'1px solid var(--border)',borderRadius:10,padding:3}}>
            <button onClick={()=>setView('grid')} style={{padding:'5px 12px',borderRadius:7,border:'none',background:view==='grid'?'var(--cyan-dim)':'transparent',color:view==='grid'?'var(--cyan)':'var(--text2)',cursor:'pointer',fontFamily:'var(--font)',fontSize:'.78rem',fontWeight:600}}>Grid</button>
            <button onClick={()=>setView('list')} style={{padding:'5px 12px',borderRadius:7,border:'none',background:view==='list'?'var(--cyan-dim)':'transparent',color:view==='list'?'var(--cyan)':'var(--text2)',cursor:'pointer',fontFamily:'var(--font)',fontSize:'.78rem',fontWeight:600}}>Day View</button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={()=>fileRef.current.click()}>↑ CSV</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Class</button>
        </div>
      </div>

      <div className="info-bar" style={{marginBottom:16}}>
        <strong>CSV format:</strong>&nbsp;<code>day, subject, start_time, end_time, room</code>
      </div>

      {loading ? <div className="empty-state"><p>Loading...</p></div> : (

        view === 'grid' ? (
          /* ── COMPACT HORIZONTAL GRID ── */
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%',minWidth:720,borderCollapse:'separate',borderSpacing:6}}>
              <thead>
                <tr>
                  {DAYS.map(day=>{
                    const c=DAY_COLOR[day]
                    const isToday=day===today
                    return (
                      <th key={day} style={{
                        padding:'8px 10px',
                        background: isToday ? c.dim : 'var(--glass)',
                        border:`1px solid ${isToday?c.border:'var(--border)'}`,
                        borderRadius:8,
                        fontSize:'.75rem',
                        fontWeight:800,
                        color: isToday ? c.accent : 'var(--text2)',
                        textAlign:'center',
                        letterSpacing:'.04em',
                        whiteSpace:'nowrap',
                        position:'relative',
                      }}>
                        {day.slice(0,3).toUpperCase()}
                        {isToday && <span style={{display:'block',width:6,height:6,borderRadius:'50%',background:c.accent,margin:'3px auto 0',boxShadow:`0 0 6px ${c.accent}`}}/>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {/* find max rows */}
                {Array.from({length:Math.max(1,...DAYS.map(d=>grouped[d].length))}).map((_,ri)=>(
                  <tr key={ri}>
                    {DAYS.map(day=>{
                      const slot=grouped[day][ri]
                      const c=DAY_COLOR[day]
                      const isToday=day===today
                      return (
                        <td key={day} style={{verticalAlign:'top'}}>
                          {slot ? (
                            <div style={{
                              background: isToday ? c.dim : 'rgba(255,255,255,0.03)',
                              border:`1px solid ${isToday?c.border:'var(--border)'}`,
                              borderRadius:8,
                              padding:'8px 10px',
                              position:'relative',
                              transition:'all .2s',
                            }}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.border;e.currentTarget.style.background=c.dim}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=isToday?c.border:'var(--border)';e.currentTarget.style.background=isToday?c.dim:'rgba(255,255,255,0.03)'}}
                            >
                              <div style={{fontWeight:700,fontSize:'.82rem',color:isToday?c.accent:'var(--text)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{slot.subject}</div>
                              <div style={{fontSize:'.68rem',color:'var(--text3)',marginBottom:2}}>{fmt12(slot.start_time)}–{fmt12(slot.end_time)}</div>
                              {slot.room && <div style={{fontSize:'.66rem',color:'var(--text3)'}}>📍 {slot.room}</div>}
                              {isToday && <div style={{marginTop:4}}><PeriodStatus start_time={slot.start_time} end_time={slot.end_time}/></div>}
                              <div style={{display:'flex',gap:4,marginTop:6}}>
                                <button onClick={()=>openEdit(slot)} style={{flex:1,padding:'3px 0',fontSize:'.65rem',fontWeight:700,background:c.dim,border:`1px solid ${c.border}`,color:c.accent,borderRadius:5,cursor:'pointer'}}>✏ Edit</button>
                                <button onClick={()=>del(slot.id)} style={{padding:'3px 6px',fontSize:'.65rem',background:'var(--rose-dim)',border:'1px solid rgba(244,63,94,0.2)',color:'var(--rose)',borderRadius:5,cursor:'pointer'}}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{height:8}}/>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── DAY VIEW ── */
          <div>
            <div className="flex gap-8" style={{marginBottom:16,flexWrap:'wrap'}}>
              {DAYS.map(day=>{
                const c=DAY_COLOR[day]
                const isActive=activeDay===day
                const isToday=day===today
                return (
                  <button key={day} onClick={()=>setActiveDay(day)}
                    style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${isActive?c.border:'var(--border)'}`,background:isActive?c.dim:'transparent',color:isActive?c.accent:'var(--text2)',fontFamily:'var(--font)',fontSize:'.8rem',fontWeight:isActive?700:500,cursor:'pointer',transition:'all .2s'}}>
                    {day.slice(0,3)}{isToday?' ●':''}
                  </button>
                )
              })}
            </div>
            {grouped[activeDay].length===0 ? (
              <div className="empty-state"><div className="icon">◫</div><h3>No classes on {activeDay}</h3></div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {grouped[activeDay].map(slot=>{
                  const c=DAY_COLOR[activeDay]
                  const isToday=activeDay===today
                  return (
                    <div key={slot.id} style={{background:'var(--glass)',border:`1px solid ${isToday?c.border:'var(--border)'}`,borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:16}}>
                      <div style={{width:4,height:52,borderRadius:2,background:c.accent,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'.95rem',marginBottom:2}}>{slot.subject}</div>
                        <div style={{fontSize:'.78rem',color:'var(--text2)'}}>🕐 {fmt12(slot.start_time)} – {fmt12(slot.end_time)}{slot.room?` · 📍 ${slot.room}`:''}</div>
                        {isToday && <div style={{marginTop:4}}><PeriodStatus start_time={slot.start_time} end_time={slot.end_time}/></div>}
                      </div>
                      <div className="flex gap-8">
                        <button onClick={()=>openEdit(slot)} style={{padding:'5px 12px',fontSize:'.75rem',fontWeight:700,background:c.dim,border:`1px solid ${c.border}`,color:c.accent,borderRadius:8,cursor:'pointer'}}>✏ Edit</button>
                        <button onClick={()=>del(slot.id)} className="btn-icon" style={{color:'var(--rose)'}}>🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>{setShowModal(false);setEditEntry(null)}}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editEntry?'✏️ Edit Class':'+ Add Class'}</h3>
              <button className="modal-close" onClick={()=>{setShowModal(false);setEditEntry(null)}}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-select" value={form.day} onChange={e=>setForm({...form,day:e.target.value})}>
                  {DAYS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Mathematics"/>
              </div>
              <div className="flex gap-12">
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Start</label>
                  <input className="form-input" type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">End</label>
                  <input className="form-input" type="time" required value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Room (optional)</label>
                <input className="form-input" value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="e.g. Room 204"/>
              </div>
              <button className="btn btn-primary w-full" disabled={saving} style={{justifyContent:'center',marginTop:8}}>
                {saving?'Saving...':(editEntry?'Update Class':'Add Class')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
