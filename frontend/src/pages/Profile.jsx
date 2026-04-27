import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { authFetch } = useAuth()
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

  if (loading) return <div className="text-center mt-24">Waking up profile engine...</div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>User Profile</h2>
          <p>Manage your identity and digital presence</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Card */}
        <div className="card" style={{ border: '1px solid var(--border-cyan)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ 
              width: 120, height: 120, borderRadius: '50%', background: 'var(--grad-purple)', 
              margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', border: '4px solid var(--bg2)', boxShadow: 'var(--purple-glow)',
              overflow: 'hidden'
            }}>
              {form.profile_pic ? <img src={form.profile_pic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{form.first_name} {form.last_name}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{form.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="info-bar">
              <strong>LinkedIn:</strong> {form.linkedin || 'Not linked'}
            </div>
            <div className="info-bar">
              <strong>GitHub:</strong> {form.github || 'Not linked'}
            </div>
            <div className="info-bar" style={{ background: 'var(--purple-dim)', borderColor: 'rgba(191, 119, 255, 0.2)' }}>
              <strong>Bio:</strong> {form.bio || 'No bio yet...'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Edit Details</h3>
          
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
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/username" />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub URL</label>
              <input className="form-input" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="github.com/username" />
            </div>

            <div className="form-group">
              <label className="form-label">Profile Picture URL</label>
              <input className="form-input" value={form.profile_pic} onChange={e => setForm({ ...form, profile_pic: e.target.value })} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." />
            </div>

            <button className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center', height: 48, fontSize: '1rem' }}>
              {saving ? 'SAVING CHANGES...' : 'UPDATE PROFILE →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
