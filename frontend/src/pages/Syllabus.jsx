import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Syllabus() {
  const { authFetch } = useAuth()
  const [syllabus, setSyllabus] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ subject:'', topics:'' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await authFetch('/api/syllabus/')
    if (res?.ok) { const d = await res.json(); setSyllabus(d.syllabus) }
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(() => setToast(null), 3000) }

  const handleAdd = async (e) => {
    e.preventDefault()
    const topics = form.topics.split('\n').map(t => t.trim()).filter(Boolean)
    if (!topics.length) return
    const res = await authFetch('/api/syllabus/bulk', { method:'POST', body:JSON.stringify({ subject:form.subject, topics }) })
    if (res?.ok) { setShowModal(false); setForm({subject:'',topics:''}); showToast('Subject added!'); load() }
  }

  const toggle = async (id) => { await authFetch(`/api/syllabus/${id}/toggle`, { method:'PATCH' }); load() }

  const delSubject = async (subject) => {
    if (!confirm(`Delete all topics for "${subject}"?`)) return
    await authFetch(`/api/syllabus/subject/${encodeURIComponent(subject)}`, { method:'DELETE' }); showToast('Subject deleted'); load()
  }

  const delTopic = async (id) => { await authFetch(`/api/syllabus/${id}`, { method:'DELETE' }); load() }

  const COLORS = ['var(--cyan)','var(--purple)','var(--emerald)','var(--amber)','var(--rose)','#a78bfa']
  const overall = syllabus.length > 0
    ? Math.round(syllabus.reduce((s,x) => s + x.progress, 0) / syllabus.length)
    : 0

  return (
    <div className="fade-in">
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>◉ &nbsp;Syllabus Tracker</h2>
          <p>{syllabus.length} subjects · {overall}% overall</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Subject</button>
      </div>

      {syllabus.length > 0 && (
        <div className="card" style={{ padding:'14px 18px', marginBottom:20 }}>
          <div className="flex-between" style={{ marginBottom:8 }}>
            <span style={{ fontSize:'.8rem', fontWeight:700 }}>Overall Completion</span>
            <span style={{ fontSize:'.8rem', fontWeight:800, color:'var(--cyan)' }}>{overall}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width:`${overall}%` }} />
          </div>
        </div>
      )}

      {loading ? <div className="quantum-loader-container"><div className="quantum-spinner"></div><div className="quantum-loader-text">Loading...</div></div>
      : syllabus.length === 0 ? (
        <div className="empty-state"><div className="icon">◉</div><h3>No subjects yet</h3><p>Add your subjects and topics to track progress</p></div>
      ) : (
        <div className="grid-2">
          {syllabus.map((s, idx) => {
            const color = COLORS[idx % COLORS.length]
            const dimColor = color.replace('var(--','').replace(')','')
            return (
              <div key={s.subject} className="card">
                <div className="flex-between" style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }} />
                    <h3 style={{ fontSize:'1rem', fontWeight:800 }}>{s.subject}</h3>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:'.85rem', fontWeight:800, color }}>{s.progress}%</span>
                    <button className="btn-icon" onClick={() => delSubject(s.subject)} style={{ fontSize:'.7rem' }}>🗑</button>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ marginBottom:12 }}>
                  <div className="progress-bar-fill" style={{ width:`${s.progress}%`, background:color }} />
                </div>
                <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:12 }}>{s.completed}/{s.total} topics completed</div>

                <div>
                  {s.topics.map(t => (
                    <div key={t.id} className={`checkbox-item ${t.status===1?'completed':''}`}>
                      <input type="checkbox" checked={t.status===1} onChange={() => toggle(t.id)} />
                      <span className="checkbox-label">{t.topic}</span>
                      <button onClick={() => delTopic(t.id)}
                        style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'.7rem', padding:'2px 6px', borderRadius:4 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Add Subject</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="flex" style={{ borderBottom:'1px solid var(--border)', marginBottom:16, gap:16 }}>
              <button style={{ background:'none', border:'none', color:'var(--text)', paddingBottom:8, borderBottom:'2px solid var(--cyan)', cursor:'pointer' }}>Manual / Auto-Extract</button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input className="form-input" required value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="e.g. Data Analytics" />
              </div>

              <div className="form-group" style={{ background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
                <label className="form-label">✨ Auto-Extract Topics</label>
                
                {/* File Upload */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', display:'block', marginBottom:4 }}>1. Upload PDF or Image</span>
                  <input type="file" className="form-input" accept=".pdf,image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file || !form.subject) return alert("Please enter subject name first before selecting a file!");
                    setToast({ msg: 'Extracting syllabus (this may take 30s+ for images)...', type: 'info' });
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('subject', form.subject);
                    try {
                      const res = await authFetch('/api/syllabus/extract', { method: 'POST', body: formData });
                      if (res?.ok) {
                        setShowModal(false); setForm({subject:'',topics:''}); showToast('Syllabus extracted!'); load();
                      } else {
                        const d = await res.json(); showToast(d.error || 'Extraction failed', 'error');
                      }
                    } catch (err) { showToast('Error parsing file', 'error'); }
                    e.target.value = null;
                  }} />
                </div>
                
                <div style={{textAlign: 'center', margin: '8px 0', fontSize: 12, color: 'var(--text3)'}}>— OR Paste Text —</div>
                
                {/* Raw Text Extract */}
                <div>
                  <textarea className="form-textarea" style={{ minHeight:60, fontSize:12 }} id="rawTextExtract"
                    placeholder="Paste the syllabus text here if the image fails..." />
                  <button type="button" className="btn" style={{ fontSize: 12, marginTop: 4, width: '100%', justifyContent: 'center' }}
                    onClick={async () => {
                      const text = document.getElementById('rawTextExtract').value;
                      if (!text || !form.subject) return alert("Enter subject and paste text!");
                      setToast({ msg: 'Extracting topics...', type: 'info' });
                      const formData = new FormData();
                      formData.append('raw_text', text);
                      formData.append('subject', form.subject);
                      try {
                        const res = await authFetch('/api/syllabus/extract', { method: 'POST', body: formData });
                        if (res?.ok) {
                          setShowModal(false); setForm({subject:'',topics:''}); showToast('Syllabus extracted!'); load();
                        } else {
                          const d = await res.json(); showToast(d.error || 'Failed', 'error');
                        }
                      } catch (err) { showToast('Error parsing', 'error'); }
                    }}>
                    Extract from Pasted Text
                  </button>
                </div>
              </div>
              
              <div style={{textAlign: 'center', margin: '16px 0', fontSize: 12, color: 'var(--text3)'}}>— OR Enter Manually —</div>
              
              <div className="form-group">
                <label className="form-label">Topics (one per line)</label>
                <textarea className="form-textarea" style={{ minHeight:80 }} value={form.topics}
                  onChange={e => setForm({...form,topics:e.target.value})}
                  placeholder={"Arrays\nLinked Lists\nStacks & Queues\nTrees\nGraphs"} />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent:'center', marginTop:8 }}>Save Manual Topics</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
