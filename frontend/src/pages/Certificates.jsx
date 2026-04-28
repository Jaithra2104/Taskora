import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const CATS = ['academic','technical','sports','extracurricular','workshop','other']
const CAT_ICON = { academic:'🎓', technical:'💻', sports:'⚽', extracurricular:'🎭', workshop:'🔧', other:'📄' }
const CAT_COLOR = { academic:'var(--cyan)', technical:'var(--purple)', sports:'var(--emerald)', extracurricular:'var(--amber)', workshop:'var(--rose)', other:'var(--text2)' }

export default function Certificates() {
  const { authFetch, API_BASE_URL } = useAuth()
  const [certs, setCerts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState({ title:'', category:'academic', issued_date:'', description:'' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [uploadErr, setUploadErr] = useState('')

  useEffect(() => { load() }, [search, catFilter])

  const load = async () => {
    let url = '/api/certificates/?'
    if (search) url += `search=${encodeURIComponent(search)}&`
    if (catFilter) url += `category=${encodeURIComponent(catFilter)}`
    const res = await authFetch(url)
    if (res?.ok) { const d = await res.json(); setCerts(d.certificates) }
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(() => setToast(null), 3500) }

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploadErr('')
    if (!file) { setUploadErr('Please select a file first'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title)
    fd.append('category', form.category)
    fd.append('issued_date', form.issued_date)
    fd.append('description', form.description)
    try {
      const res = await authFetch('/api/certificates/', { method:'POST', body:fd })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error || 'Upload failed'); return }
      setShowModal(false)
      setForm({ title:'', category:'academic', issued_date:'', description:'' })
      setFile(null)
      showToast('Certificate uploaded!')
      load()
    } catch (err) {
      setUploadErr('Upload error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const del = async (id) => {
    if (!confirm('Delete this certificate?')) return
    await authFetch(`/api/certificates/${id}`, { method:'DELETE' }); showToast('Deleted'); load()
  }

  return (
    <div className="fade-in">
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>✦ &nbsp;Certificates</h2>
          <p>{certs.length} certificates stored</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setUploadErr(''); setShowModal(true) }}>+ Upload Certificate</button>
      </div>

      {/* Filters */}
      <div className="flex gap-12" style={{ marginBottom:20, flexWrap:'wrap' }}>
        <div className="search-bar" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">⌕</span>
          <input placeholder="Search certificates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width:180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
      </div>

      {/* Category chips */}
      <div className="flex gap-8" style={{ marginBottom:20, flexWrap:'wrap' }}>
        <button className={`btn btn-sm ${catFilter===''?'btn-primary':'btn-secondary'}`} onClick={() => setCatFilter('')}>All</button>
        {CATS.map(c => (
          <button key={c} className={`btn btn-sm ${catFilter===c?'btn-primary':'btn-secondary'}`} onClick={() => setCatFilter(catFilter===c?'':c)}
            style={{ color: catFilter===c ? undefined : CAT_COLOR[c] }}>
            {CAT_ICON[c]} {c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="quantum-loader-container"><div className="quantum-spinner"></div><div className="quantum-loader-text">Loading...</div></div>
      : certs.length === 0 ? (
        <div className="empty-state"><div className="icon">✦</div><h3>No certificates yet</h3><p>Upload your first certificate</p></div>
      ) : (
        <div className="cert-grid">
          {certs.map(c => (
            <div key={c.id} className="cert-card">
              <div style={{ fontSize:'2rem', marginBottom:10 }}>{CAT_ICON[c.category]||'📄'}</div>
              <div style={{ fontSize:'.75rem', fontWeight:700, color:CAT_COLOR[c.category]||'var(--text2)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{c.category}</div>
              <div style={{ fontWeight:700, fontSize:'.95rem', marginBottom:4 }}>{c.title}</div>
              {c.issued_date && <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:8 }}>📅 {c.issued_date}</div>}
              {c.description && <p style={{ fontSize:'.78rem', color:'var(--text2)', marginBottom:10, lineHeight:1.4 }}>{c.description}</p>}
              <div className="flex gap-8">
                <a href={API_BASE_URL + c.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">View File</a>
                <button className="btn btn-sm btn-danger" onClick={() => del(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✦ Upload Certificate</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {uploadErr && <div className="error-msg">⚠ {uploadErr}</div>}
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. AWS Cloud Practitioner" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                  {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File (PDF / Image)</label>
                <input className="form-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" required onChange={e => setFile(e.target.files[0])} />
                <div style={{ fontSize:'.7rem', color:'var(--text3)', marginTop:4 }}>Accepted: PDF, PNG, JPG, JPEG, GIF, WEBP</div>
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date (optional)</label>
                <input className="form-input" type="date" value={form.issued_date} onChange={e => setForm({...form,issued_date:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Notes..." />
              </div>
              <button className="btn btn-primary w-full" disabled={uploading} style={{ justifyContent:'center', marginTop:8 }}>
                {uploading ? 'Uploading...' : '↑ Upload Certificate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
