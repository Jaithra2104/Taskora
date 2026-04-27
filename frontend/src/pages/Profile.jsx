import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
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
      const res = await fetch(`${API_BASE_URL}/api/profile/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setForm(prev => ({ ...prev, profile_pic: data.file_url }))
        setSuccess('Photo uploaded!')
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

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--cyan)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Syncing Profile...</p>
    </div>
  )

  const profileImg = form.profile_pic ? (form.profile_pic.startsWith('http') ? form.profile_pic : `${API_BASE_URL}${form.profile_pic}`) : null

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Identity Hub</h2>
          <p>Customize how the world sees you on Taskora</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ border: '1px solid var(--border-cyan)', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '50%', background: 'var(--grad-purple)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '4rem', border: '4px solid var(--bg2)', boxShadow: 'var(--purple-glow)',
                overflow: 'hidden'
              }}>
                {profileImg ? <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ position: 'absolute', bottom: 5, right: 5, width: 36, height: 36, borderRadius: '50%', background: 'var(--cyan)', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 15px var(--cyan)' }}
                title="Upload Photo"
              >
                📸
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{form.first_name || 'Anonymous'} {form.last_name}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: 20 }}>{form.email}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <a href={formatLink(form.linkedin)} target="_blank" rel="noreferrer" className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.2rem' }} title="LinkedIn">
                🔗
              </a>
              <a href={formatLink(form.github)} target="_blank" rel="noreferrer" className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.2rem' }} title="GitHub">
                🐙
              </a>
              <a href={`tel:${form.mobile_no}`} className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.2rem' }} title="Call">
                📱
              </a>
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: '.9rem', color: 'var(--text2)', fontStyle: 'italic' }}>
              "{form.bio || 'Add a bio to express yourself!'}"
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, color: 'var(--cyan)' }}>Quick Avatars</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRESET_AVATARS.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setForm(prev => ({ ...prev, profile_pic: url }))}
                  style={{ 
                    aspectRatio: '1/1', borderRadius: 12, cursor: 'pointer', overflow: 'hidden', 
                    border: form.profile_pic === url ? '3px solid var(--cyan)' : '2px solid transparent',
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
              <label className="form-label">LinkedIn (Username or URL)</label>
              <input className="form-input" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/username" />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub (Username or URL)</label>
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
