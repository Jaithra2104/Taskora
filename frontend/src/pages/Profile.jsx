import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const CARTOON_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo'
]

export default function Profile() {
  const { authFetch, API_BASE_URL } = useAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', mobile_no: '',
    linkedin: '', github: '', profile_pic: '', bio: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch('/api/profile/')
        if (res.ok) {
          const data = await res.json()
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            mobile_no: data.mobile_no || '',
            linkedin: data.linkedin || '',
            github: data.github || '',
            profile_pic: data.profile_pic || '',
            bio: data.bio || ''
          })
        }
      } catch (err) {
        setError('Failed to load profile details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authFetch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await authFetch('/api/profile/', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    setSaving(true)
    try {
      const res = await authFetch('/api/profile/upload', {
        method: 'POST',
        body: formData
      })
      if (!res) throw new Error('Authorization failed. Please login again.')
      
      const data = await res.json()
      if (res.ok) {
        setForm(prev => ({ ...prev, profile_pic: data.file_url }))
        setSuccess('Photo uploaded successfully!')
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatLink = (url) => {
    if (!url) return '#'
    if (url.startsWith('http')) return url
    return `https://${url}`
  }

  if (loading) return <div className="text-center mt-24">Loading Profile...</div>

  const profileImg = form.profile_pic ? (form.profile_pic.startsWith('http') ? form.profile_pic : `${API_BASE_URL}${form.profile_pic}`) : null

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Identity Hub</h2>
          <p>Customize your digital avatar and social presence</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ border: '1px solid var(--border-cyan)', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '4px solid var(--cyan)', boxShadow: 'var(--cyan-glow)',
                overflow: 'hidden'
              }}>
                {profileImg ? <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user" style={{fontSize: '3rem', color: 'var(--text3)'}}></i>}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ position: 'absolute', bottom: 5, right: 5, width: 36, height: 36, borderRadius: '50%', background: 'var(--cyan)', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 15px var(--cyan)' }}
                title="Upload Photo"
              >
                <i className="fas fa-camera"></i>
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{form.first_name || 'Anonymous'} {form.last_name}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: 20 }}>{form.email}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              <a href={formatLink(form.linkedin)} target="_blank" rel="noreferrer" className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.4rem', color: '#0077b5' }} title="LinkedIn">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href={formatLink(form.github)} target="_blank" rel="noreferrer" className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.4rem', color: '#fff' }} title="GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href={`tel:${form.mobile_no}`} className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.4rem', color: 'var(--emerald)' }} title="Call">
                <i className="fas fa-phone"></i>
              </a>
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: '.9rem', color: 'var(--text2)', fontStyle: 'italic' }}>
              "{form.bio || 'Add a bio to express yourself!'}"
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, color: 'var(--cyan)' }}>Choose Cartoon Avatar</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {CARTOON_AVATARS.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setForm(prev => ({ ...prev, profile_pic: url }))}
                  style={{ 
                    aspectRatio: '1/1', borderRadius: 12, cursor: 'pointer', overflow: 'hidden', 
                    background: 'var(--bg2)', border: form.profile_pic === url ? '3px solid var(--cyan)' : '2px solid var(--border)',
                    transition: 'all 0.2s', transform: form.profile_pic === url ? 'scale(1.05)' : 'none'
                  }}
                >
                  <img src={url} alt={`Avatar ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Account Settings</h3>
          
          {error && <div className="error-msg">{error}</div>}
          {success && <div style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="John" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" value={form.mobile_no} onChange={e => setForm({ ...form, mobile_no: e.target.value })} placeholder="+1 234 567 890" />
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL</label>
              <input className="form-input" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/username" />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub Profile URL</label>
              <input className="form-input" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="github.com/username" />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Bio</label>
              <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about your goals and skills..." />
            </div>

            <button className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center', height: 48, fontSize: '1rem', marginTop: 10 }}>
              {saving ? 'PROCESSING...' : 'SAVE CHANGES →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
