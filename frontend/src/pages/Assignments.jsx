import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Assignments() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title:'', subject:'', description:'', due_date:'', priority:'medium' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await authFetch('/api/assignments/')
    if (res?.ok) { const d = await res.json(); setItems(d.assignments) }
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(() => setToast(null), 3000) }

  const handleAdd = async (e) => {
    e.preventDefault()
    const res = await authFetch('/api/assignments/', { method:'POST', body:JSON.stringify(form) })
    if (res?.ok) { setShowModal(false); setForm({title:'',subject:'',description:'',due_date:'',priority:'medium'}); showToast('Assignment added!'); load() }
  }

  const complete = async (id) => {
    await authFetch(`/api/assignments/${id}`, { method:'PUT', body:JSON.stringify({status:'completed'}) }); showToast('Marked complete!'); load()
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    await authFetch(`/api/assignments/${id}`, { method:'DELETE' }); showToast('Deleted'); load()
  }

  const daysLeft = (dateStr) => {
    const now = new Date(); now.setHours(0,0,0,0)
    return Math.ceil((new Date(dateStr) - now) / 86400000)
  }

  const PRIORITY = { low:'badge-cyan', medium:'badge-amber', high:'badge-rose' }

  const pending = items.filter(a => a.status==='pending').length
  const done = items.filter(a => a.status==='completed').length

  return (
    <div className="fade-in">
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>⏰ &nbsp;Assignments</h2>
          <p>{pending} pending · {done} completed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Assignment</button>
      </div>

      {loading ? <div className="empty-state"><p>Loading...</p></div>
      : items.length === 0 ? (
        <div className="empty-state"><div className="icon">⏰</div><h3>No assignments yet</h3><p>Add your first assignment to start tracking</p></div>
      ) : (
        <div className="grid-2">
          {items.map(a => {
            const d = daysLeft(a.due_date)
            const cls = a.status==='completed' ? 'ok' : d <= 1 ? 'urgent' : d <= 3 ? 'soon' : 'ok'
            const label = a.status==='completed' ? '✓ Done' : d < 0 ? 'Overdue!' : d === 0 ? 'Due Today!' : d === 1 ? '1 day left' : `${d} days left`
            const bc = a.status==='completed' ? 'var(--border)' : d <= 1 ? 'rgba(244,63,94,0.2)' : d <= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.1)'
            return (
              <div key={a.id} className="card" style={{ opacity: a.status==='completed'?.6:1, borderColor:bc }}>
                <div className="flex-between" style={{ marginBottom:10 }}>
                  <span className={`badge ${PRIORITY[a.priority]}`}>{a.priority.toUpperCase()}</span>
                  <span className={`countdown ${cls}`}>{label}</span>
                </div>
                <h4 style={{ fontSize:'1rem', fontWeight:700, marginBottom:4, textDecoration:a.status==='completed'?'line-through':'none' }}>{a.title}</h4>
                <div style={{ fontSize:'.78rem', color:'var(--text2)', marginBottom:4 }}>{a.subject}</div>
                {a.description && <p style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:10 }}>{a.description}</p>}
                <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:12 }}>📅 Due: {a.due_date}</div>
                <div className="flex gap-8">
                  {a.status !== 'completed' && <button className="btn btn-sm btn-success" onClick={() => complete(a.id)}>✓ Complete</button>}
                  <button className="btn btn-sm btn-danger" onClick={() => del(a.id)}>Delete</button>
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
              <h3>+ Add Assignment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Lab Report #3" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" required value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="e.g. Chemistry" />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Details..." />
              </div>
              <div className="flex gap-12">
                <div className="form-group" style={{ flex:1 }}>
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" required value={form.due_date} onChange={e => setForm({...form,due_date:e.target.value})} />
                </div>
                <div className="form-group" style={{ flex:1 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent:'center', marginTop:8 }}>Add Assignment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
