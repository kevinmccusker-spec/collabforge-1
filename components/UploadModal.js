import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'

export default function UploadModal({ onClose, onSuccess }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState('form') // 'form' | 'confirm'
  const [contentType, setContentType] = useState('audio') // 'audio' | 'lyrics'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState(null)
  const [lyricsText, setLyricsText] = useState('')
  const [needsMusic, setNeedsMusic] = useState(true)
  const [aiDisclosure, setAiDisclosure] = useState('human_made')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (f && f.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB')
      return
    }
    setFile(f)
    setError('')
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    if (contentType === 'audio' && !file) { setError('Please select an audio file'); return }
    if (contentType === 'lyrics' && !lyricsText.trim()) { setError('Please write some lyrics or poetry'); return }
    setStep('confirm')
  }

  async function confirmRelease() {
    if (!confirmed) return
    setLoading(true)
    setError('')

    try {
      let audioUrl = ''

      // Only upload file for audio content
      if (contentType === 'audio') {
        const ext = file.name.split('.').pop()
        const path = `songs/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('audio').upload(path, file)
        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)
        audioUrl = publicUrl
      }

      // Create song
      const { data: song, error: songErr } = await supabase
        .from('songs')
        .insert({
          title,
          description,
          user_id: user.id,
          username: profile?.username,
          ai_disclosure: aiDisclosure,
          content_type: contentType,
          lyrics_text: contentType === 'lyrics' ? lyricsText.trim() : null,
          needs_music: contentType === 'lyrics' ? needsMusic : false
        })
        .select().single()
      if (songErr) throw songErr

      // Create original version
      const { error: versionErr } = await supabase.from('versions').insert({
        song_id: song.id,
        parent_song_id: song.id,
        user_id: user.id,
        audio_url: audioUrl,
        is_original: true,
        version_type: 'original',
        ai_disclosure: aiDisclosure,
        notes: tags || '',
        contribution_notes: contentType === 'lyrics' ? 'original lyrics' : 'original upload'
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
      <div className="modal-box" style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
          Before You Let Go
        </h2>

        <div style={{ background: 'rgba(255,107,53,0.1)', borderLeft: '3px solid var(--burnt-orange)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>
            You're about to release <strong>"{title}"</strong> to the hive mind.
          </p>
          <p style={{ lineHeight: 1.8, opacity: 0.9 }}>
            Anyone can listen, finish it, cover it, or build new versions from it. You stay credited as the original on every version that descends from yours, forever. Splits are equal among everyone in any version's chain — and you're always at the root.
          </p>
        </div>

        <div style={{ background: 'rgba(10,10,10,0.6)', padding: '1.25rem', marginBottom: '1.5rem', borderLeft: '2px dashed rgba(255,200,87,0.3)' }}>
          <p className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>What This Means</p>
          <ul style={{ listStyle: 'none', lineHeight: 2.2, fontSize: '1rem' }}>
            <li>✓ Your original is the root of every chain</li>
            <li>✓ You're credited on every version that builds from yours</li>
            <li>✓ Splits are equal: 2-person chain = 50/50, 3-person = 33/33/33, etc.</li>
            <li>✓ Anyone in a chain can release their version through DistroKid, CD Baby, or TuneCore</li>
            <li>✓ The Contribution Record is your reference for filling out split sheets</li>
            <li style={{ color: 'var(--muted-red)', marginTop: 4 }}>✗ You cannot delete versions once uploaded</li>
          </ul>
        </div>

        <div style={{ borderLeft: '3px solid var(--accent-yellow)', padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(255,200,87,0.05)' }}>
          <p style={{ fontStyle: 'italic', lineHeight: 1.7, fontSize: '1.05rem', opacity: 0.9 }}>
            "A song unfinished is a song unheard."
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18 }} />
          <span>I understand I'm releasing this song to the community. The Contribution Record is the source of truth for splits. Anyone in a chain can release their version with the proper splits filled out. CollabForge records lineage but does not enforce splits or arbitrate disputes — that's between the artists and their distributor. I'm responsible for any mechanical licenses required for cover material.</span>
        </label>

        {error && <p className="error" style={{ marginBottom: '1rem' }}>⚠ {error}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => setStep('form')}>Go Back</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={confirmRelease}
            disabled={!confirmed || loading}
          >
            {loading ? 'Releasing...' : 'Let It Go →'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--cream)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>

        <h2 className="mono" style={{ color: 'var(--accent-yellow)', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
          Give Your Song a Place to Grow
        </h2>
        <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Release it to the hive mind. See what becomes of it.</p>

        {/* Content Type Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setContentType('audio')}
            style={{
              flex: 1,
              opacity: contentType === 'audio' ? 1 : 0.5,
              borderColor: contentType === 'audio' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)',
              color: contentType === 'audio' ? 'var(--accent-yellow)' : 'var(--cream)'
            }}
          >
            🎵 Audio
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setContentType('lyrics')}
            style={{
              flex: 1,
              opacity: contentType === 'lyrics' ? 1 : 0.5,
              borderColor: contentType === 'lyrics' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)',
              color: contentType === 'lyrics' ? 'var(--accent-yellow)' : 'var(--cream)'
            }}
          >
            📝 Lyrics / Poem
          </button>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>
              {contentType === 'audio' ? 'Song Title *' : 'Title *'}
            </label>
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

          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.6rem', opacity: 0.8 }}>How was this made? *</label>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem', background: aiDisclosure === 'human_made' ? 'rgba(255,200,87,0.1)' : 'rgba(255,255,255,0.03)', border: aiDisclosure === 'human_made' ? '1px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.1)' }}>
                <input type="radio" name="ai_disclosure" value="human_made" checked={aiDisclosure === 'human_made'} onChange={e => setAiDisclosure(e.target.value)} />
                <span style={{ fontSize: '0.9rem' }}><strong>Human-made</strong> — recorded with instruments, voice, traditional production</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem', background: aiDisclosure === 'ai_assisted' ? 'rgba(255,200,87,0.1)' : 'rgba(255,255,255,0.03)', border: aiDisclosure === 'ai_assisted' ? '1px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.1)' }}>
                <input type="radio" name="ai_disclosure" value="ai_assisted" checked={aiDisclosure === 'ai_assisted'} onChange={e => setAiDisclosure(e.target.value)} />
                <span style={{ fontSize: '0.9rem' }}><strong>AI-assisted</strong> — used AI tools for parts (vocals, mastering, finishing, etc.)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem', background: aiDisclosure === 'pure_ai' ? 'rgba(255,200,87,0.1)' : 'rgba(255,255,255,0.03)', border: aiDisclosure === 'pure_ai' ? '1px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.1)' }}>
                <input type="radio" name="ai_disclosure" value="pure_ai" checked={aiDisclosure === 'pure_ai'} onChange={e => setAiDisclosure(e.target.value)} />
                <span style={{ fontSize: '0.9rem' }}><strong>Pure AI</strong> — primarily generated by AI (Suno, Udio, etc.)</span>
              </label>
            </div>
            <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Honest disclosure helps the community give the right kind of feedback.</p>
          </div>

          {/* Audio file upload OR lyrics textarea based on content type */}
          {contentType === 'audio' ? (
            <div style={{ border: '2px dashed var(--accent-yellow)', padding: '2rem', textAlign: 'center', position: 'relative', background: 'rgba(255,200,87,0.04)', cursor: 'pointer' }}>
              <input type="file" accept="audio/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <div className="mono" style={{ color: 'var(--accent-yellow)', pointerEvents: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📼</div>
                <div>{file ? `✓ ${file.name}` : 'Drop your raw track here'}</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.6 }}>MP3, M4A, or WAV · Max 50MB</div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Your Lyrics / Poem *</label>
                <textarea
                  value={lyricsText}
                  onChange={e => setLyricsText(e.target.value)}
                  rows={10}
                  placeholder="Type or paste your lyrics here..."
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  required
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={needsMusic} onChange={e => setNeedsMusic(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span className="mono" style={{ fontSize: '0.8rem', opacity: 0.8 }}>Looking for someone to set this to music</span>
              </label>
            </>
          )}

          {error && <p className="error">⚠ {error}</p>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Continue →
          </button>
        </form>
      </div>
    </div>
  )
}
