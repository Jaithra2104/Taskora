import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function StudyAssistant() {
  const { authFetch } = useAuth()
  const [syllabus, setSyllabus] = useState([])
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('English')
  
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState([])
  const [experts, setExperts] = useState([])

  const [activeVideo, setActiveVideo] = useState(null)
  const [notes, setNotes] = useState('')
  const [smartPoints, setSmartPoints] = useState([])
  const [savingNote, setSavingNote] = useState(false)

  const LANGUAGES = ['English', 'Spanish', 'Hindi', 'Telugu', 'French', 'German']

  // Load syllabus on mount
  useEffect(() => {
    loadSyllabus()
  }, [])

  const loadSyllabus = async () => {
    const res = await authFetch('/api/syllabus/')
    if (res?.ok) {
      const d = await res.json()
      setSyllabus(d.syllabus)
    }
  }

  // Search Videos when topic or language changes
  useEffect(() => {
    if (topic && language) {
      searchVideos()
    }
  }, [topic, language])

  const searchVideos = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/study/search?topic=${encodeURIComponent(topic)}&language=${encodeURIComponent(language)}`)
      if (res?.ok) {
        const d = await res.json()
        setVideos(d.videos)
        setExperts(d.experts)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = async (v) => {
    setActiveVideo(v)
    setSmartPoints([
      `✨ Generating AI Summary for "${v.title}"...`,
      `⏳ Please wait a moment while the video transcript is downloaded and analyzed by the AI.`
    ])
    
    try {
      const sumRes = await authFetch(`/api/study/summarize/${v.id}`)
      if (sumRes?.ok) {
        const d = await sumRes.json()
        setSmartPoints(d.summary.split('\\n').filter(l => l.trim().length > 0))
      } else {
        const err = await sumRes.json()
        if (err.error === 'AI_KEY_MISSING') {
           setSmartPoints([
             '⚠️ AI SUMMARIZATION DISABLED',
             'Your app needs a Gemini API key to read video transcripts.',
             '1. Go to Google AI Studio and get a free key.',
             '2. Open backend/config.py and paste it into GEMINI_API_KEY.',
             '3. Restart your backend server.'
           ])
        } else {
           setSmartPoints([
             '⚠️ Could not extract transcript for this video.',
             'Some videos do not have English subtitles enabled.',
             'Please try a different video lecture.'
           ])
        }
      }
    } catch (err) {
      setSmartPoints(['Failed to contact summarization server.'])
    }
    
    // Fetch existing notes
    const res = await authFetch(`/api/study/notes/${v.id}`)
    if (res?.ok) {
      const d = await res.json()
      if (d.notes && d.notes.length > 0) {
        setNotes(d.notes[0].content)
      } else {
        setNotes('')
      }
    }
  }

  const saveNotes = async () => {
    if (!activeVideo) return
    setSavingNote(true)
    try {
      await authFetch('/api/study/notes', {
        method: 'POST',
        body: JSON.stringify({
          video_id: activeVideo.id,
          topic: topic,
          content: notes
        })
      })
    } catch (err) {
      console.error("Failed to save notes", err)
    } finally {
      setTimeout(() => setSavingNote(false), 500)
    }
  }

  const currentSyllabus = syllabus.find(s => s.subject === subject)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>⬡ &nbsp;Study Assistant</h2>
          <p>Dynamic video lectures and smart notes workspace</p>
        </div>
      </div>

      {!activeVideo ? (
        <>
          {/* Main Search View */}
          <div className="card" style={{ marginBottom:24 }}>
            <div className="flex gap-12" style={{ flexWrap:'wrap' }}>
              <div className="form-group" style={{ flex:1, minWidth:200, marginBottom:0 }}>
                <label className="form-label">Subject</label>
                <select className="form-select" value={subject} onChange={e => { setSubject(e.target.value); setTopic('') }}>
                  <option value="">— Select from Syllabus —</option>
                  {syllabus.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                </select>
              </div>
              {currentSyllabus && (
                <div className="form-group" style={{ flex:1, minWidth:200, marginBottom:0 }}>
                  <label className="form-label">Topic</label>
                  <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
                    <option value="">— Select topic —</option>
                    {currentSyllabus.topics.map(t => <option key={t.id} value={t.topic}>{t.topic}</option>)}
                  </select>
                </div>
              )}
              {topic && (
                <div className="form-group" style={{ flex:1, minWidth:150, marginBottom:0 }}>
                  <label className="form-label">Language</label>
                  <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {!subject && (
            <div className="empty-state">
              <div style={{ fontSize:'3rem', marginBottom:16 }}>⬡</div>
              <h3>Select a subject to begin</h3>
              <p>Your subjects and topics are dynamically loaded from your Syllabus Tracker.</p>
            </div>
          )}

          {subject && topic && (
            <>
              {experts.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: '.85rem', color: 'var(--text2)', marginRight: 12 }}>Suggested Experts:</span>
                  <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                    {experts.map(exp => (
                      <span key={exp} style={{ background: 'var(--surface2)', padding: '4px 12px', borderRadius: 20, fontSize: '.8rem', color: 'var(--cyan)' }}>
                        ★ {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="empty-state"><p>Searching YouTube...</p></div>
              ) : videos.length === 0 ? (
                <div className="card" style={{ marginBottom:24 }}>
                  <p style={{ color:'var(--text2)', fontSize:'.875rem' }}>No videos found for this topic.</p>
                </div>
              ) : (
                <div className="video-grid" style={{ marginBottom:28 }}>
                  {videos.map(v => (
                    <div key={v.id} className="video-card" onClick={() => handleVideoSelect(v)} style={{ cursor: 'pointer' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderBottom: '1px solid var(--border)' }} />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: 4, fontSize: '.7rem' }}>{v.duration}</div>
                      </div>
                      <div className="video-info">
                        <div className="video-title">{v.title}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 4 }}>{v.channel} • {v.views} views</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Notes Workspace View */
        <div>
          <button className="btn" onClick={() => setActiveVideo(null)} style={{ marginBottom: 16 }}>← Back to Search</button>
          
          <div className="grid-2" style={{ alignItems: 'flex-start' }}>
            
            {/* Left: Video Player */}
            <div className="w-full">
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                <iframe 
                  src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`} 
                  title={activeVideo.title}
                  style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{activeVideo.title}</h3>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{activeVideo.channel}</p>
            </div>

            {/* Right: Notes Workspace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Smart Points */}
              <div className="card" style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                <h4 style={{ marginBottom: 12, color: 'var(--cyan)' }}>✨ AI Summary</h4>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {smartPoints.join('\\n')}
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: 16, fontSize: '.75rem', padding: '6px 12px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setNotes(prev => prev + (prev ? '\\n\\n' : '') + smartPoints.join('\\n'))}
                >
                  Copy to My Notes
                </button>
              </div>

              {/* My Notes */}
              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 300 }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <h4>📝 My Notes Space</h4>
                  <button className="btn" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={saveNotes}>
                    {savingNote ? 'Saved!' : 'Save Notes'}
                  </button>
                </div>
                <textarea 
                  className="form-textarea" 
                  style={{ flex: 1, resize: 'none', background: 'var(--surface)', border: 'none', padding: 12, fontSize: '.9rem', fontFamily: 'inherit' }}
                  placeholder="Prepare your notes here..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={saveNotes}
                />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
