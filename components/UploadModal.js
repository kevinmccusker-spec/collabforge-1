import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'

export default function UploadModal({ onClose, onSuccess }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState('form') // 'form' | 'confirm'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (f && f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }
    setFile(f)
    setError('')
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Please select an audio file'); return }
    setStep('confirm')
  }

  async function confirmRelease() {
    if (!confirmed) return
    setLoading(true)
    setError('')

    try {
      // Upload file
      const ext = file.name.split('.').pop()
      const path = `songs/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('audio').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

      // Create song
      const { data: song, error: songErr } = await supabase
        .from('songs')
        .insert({ title, description, user_id: user.id, is_complete: false })
        .select().single()
      if (songErr) throw songErr

      // Create original version
      const { error: versionErr } = await supabase.from('versions').insert({
        song_id: song.id,
        user_id: user.id,
        audio_url: publicUrl,
        is_original: true,
        version_type: 'original',
        notes: tags || ''
      })
      if (versionErr) throw versionErr

      onSuccess()
    } catch (err) {
      setError(err.message)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirm') return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <h2 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
          Before You Let Go
        </h2>

        <div style={{ background: 'rgba(255,107,53,0.1)', borderLeft: '3px solid var(--burnt-orange)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>
            You're about to release <strong>"{title}"</strong> into the world.
          </p>
          <p style={{ lineHeight: 1.8, opacity: 0.9 }}>
            Anyone can download it, remix it, rewrite it, change the genre, make it unrecognizable.
            You will always be credited as the original creator, but you <strong>cannot delete or veto</strong> what others do with it.
          </p>
        </div>

        <div style={{ background: 'rgba(10,10,10,0.6)', padding: '1.25rem', marginBottom: '1.5rem', borderLeft: '2px dashed rgba(255,200,87,0.3)' }}>
          <p className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>What This Means</p>
          <ul style={{ listStyle: 'none', lineHeight: 2.2, fontSize: '1rem' }}>
            <li>âœ“ Your original stays pinned at the top</li>
            <li>âœ“ You're credited as the original creator</li>
            <li>âœ“ You earn 60% of royalties if it goes commercial</li>
            <li style={{ color: 'var(--muted-red)', marginTop: 4 }}>âœ— You cannot delete or veto remixes</li>
          </ul>
        </div>

        <div style={{ borderLeft: '3px solid var(--accent-yellow)', padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(255,200,87,0.05)' }}>
          <p style={{ fontStyle: 'italic', lineHeight: 1.7, fontSize: '1.05rem', opacity: 0.9 }}>
            "This is about getting the song out of your head so it stops rotting inside you. Once it's posted, it belongs to the world. You just get to watch what happens."
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18 }} />
          <span>I understand I'm releasing this song to the community and giving up control over how it's remixed or reimagined.</span>
        </label>

        {error && <p className="error" style={{ marginBottom: '1rem' }}>âš  {error}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => setStep('form')}>Go Back</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={confirmRelease}
            disabled={!confirmed || loading}
          >
            {loading ? 'Releasing...' : 'Let It Go â†’'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--cream)', fontSize: '1.5rem', cursor: 'pointer' }}>Ã—</button>

        <h2 className="mono" style={{ color: 'var(--accent-yellow)', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
          Release Your Unfinished Work
        </h2>
        <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Once you post it, you give up control. It belongs to the world now.</p>

        <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Song Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's this called?" required />
          </div>

          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Story / Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What were you trying to say? What's unfinished?" style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Mood / Genre Tags</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. indie, sad, lo-fi, acoustic" />
          </div>

          <div style={{ border: '2px dashed var(--accent-yellow)', padding: '2rem', textAlign: 'center', position: 'relative', background: 'rgba(255,200,87,0.04)', cursor: 'pointer' }}>
            <input type="file" accept="audio/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            <div className="mono" style={{ color: 'var(--accent-yellow)', pointerEvents: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ðŸ“¼</div>
              <div>{file ? `âœ“ ${file.name}` : 'Drop your raw track here'}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.6 }}>MP3 or WAV Â· Max 10MB</div>
            </div>
          </div>

          {error && <p className="error">âš  {error}</p>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Continue â†’
          </button>
        </form>
      </div>
    </div>
  )
}
