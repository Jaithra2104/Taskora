import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Homework() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ subject:'', description:'', due_date:'' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await authFetch('/api/homework/')
    if (res?.ok) { const d = await res.json(); setItems(d.homework) }
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(() => setToast(null), 3000) }

  const handleAdd = async (e) => {
    e.preventDefault()
    const res = await authFetch('/api/homework/', { method:'POST', body:JSON.stringify(form) })
    if (res?.ok) { setShowModal(false); setForm({subject:'',description:'',due_date:''}); showToast('Homework added!'); load() }
  }

  const toggle = async (id) => {
    await authFetch(`/api/homework/${id}/toggle`, { method:'PATCH' }); load()
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    await authFetch(`/api/homework/${id}`, { method:'DELETE' }); showToast('Deleted'); load()
  }

  const filtered = filter === 'all' ? items : items.filter(h => h.status === filter)
  const pending = items.filter(h => h.status === 'pending').length
  const done = items.filter(h => h.status === 'completed').length
  const pct = items.length > 0 ? Math.round((done/items.length)*100) : 0

  return (
    <div className="fade-in">
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>✎ &nbsp;Homework Tracker</h2>
          <p>{pending} pending · {done} completed · {pct}% done</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Homework</button>
      </div>

      {items.length > 0 && (
        <div className="card" style={{ padding:'14px 18px', marginBottom:20 }}>
          <div className="flex-between" style={{ marginBottom:8 }}>
            <span style={{ fontSize:'.8rem', fontWeight:700 }}>Overall Progress</span>
            <span style={{ fontSize:'.8rem', fontWeight:800, color:'var(--amber)' }}>{pct}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width:`${pct}%`, background:'var(--amber)' }} />
          </div>
        </div>
      )}

      <div className="flex gap-8" style={{ marginBottom:20, flexWrap:'wrap' }}>
        {['all','pending','completed'].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f==='all'?`All (${items.length})`:f==='pending'?`Pending (${pending})`:`Done (${done})`}
          </button>
        ))}
      </div>

      {loading ? <div className="empty-state"><p>Loading...</p></div>
      : filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">✎</div><h3>Nothing here</h3><p>Add your homework to track it</p></div>
      ) : (
        <div className="grid-2">
          {filtered.map(h => (
            <div key={h.id} className="card" style={{ opacity: h.status==='completed' ? .65 : 1, borderColor: h.status==='completed' ? 'var(--border)' : 'rgba(245,158,11,0.15)' }}>
              <div className="flex-between" style={{ marginBottom:10 }}>
                <span className="badge badge-amber">{h.subject}</span>
                <span className={`badge ${h.status==='completed'?'badge-emerald':'badge-amber'}`}>
                  {h.status==='completed' ? '✓ Done' : '⏳ Pending'}
                </span>
              </div>
              <p style={{ fontSize:'.875rem', marginBottom:12, color: h.status==='completed'?'var(--text3)':'var(--text)', textDecoration: h.status==='completed'?'line-through':'none', lineHeight:1.5 }}>
                {h.description}
              </p>
              {h.due_date && <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:12 }}>📅 Due: {h.due_date}</div>}
              <div className="flex gap-8">
                <button className={`btn btn-sm ${h.status==='completed'?'btn-secondary':'btn-success'}`} onClick={() => toggle(h.id)}>
                  {h.status==='completed' ? 'Undo' : '✓ Mark Done'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => del(h.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Add Homework</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" required value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="e.g. Physics" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" required value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="What needs to be done?" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date (optional)</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form,due_date:e.target.value})} />
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent:'center', marginTop:8 }}>Add Homework</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
