import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'

export default function SongCard({ song, onUpdate, onAuthRequired }) {
  const { user } = useAuth()
  const [showAll, setShowAll] = useState(false)
  const [showRemix, setShowRemix] = useState(false)
  const [liking, setLiking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const topVersions = song.versions.slice(0, 11)
  const hiddenVersions = song.versions.slice(11)

  async function toggleLike(versionId, currentLikes) {
    if (!user) { onAuthRequired(); return }
    if (liking) return
    setLiking(true)

    // Check if liked
    const { data: existing } = await supabase
      .from('version_likes')
      .select('id')
      .eq('version_id', versionId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase.from('version_likes').delete().eq('id', existing.id)
    } else {
      await supabase.from('version_likes').insert({ version_id: versionId, user_id: user.id })

    }

    setLiking(false)
    onUpdate()
  }

  return (
    <div className={`card fade-in ${song.is_complete ? 'complete' : ''}`}>
      {song.is_complete && (
        <div className="mono" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.7rem', color: 'var(--accent-yellow)', background: 'var(--deep-black)', padding: '0.25rem 0.6rem', border: '1px solid var(--accent-yellow)', letterSpacing: 1 }}>
          ✓ COMPLETE
        </div>
      )}

      {/* Song Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h2 className="mono" style={{ fontSize: '1.1rem', color: 'var(--burnt-orange)', letterSpacing: '-1px', marginBottom: '0.4rem' }}>
          {song.title}
        </h2>
        
        {song.description && expanded && (
      <p style={{ marginTop: '0.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>{song.description}</p>
      )}
      </div>

      {/* Versions */}
      <div style={{ borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '1rem' }}>
        
      {/* Always show original */}
      {song.versions.filter(v => v.is_original).map(version => (
      <div key={version.id} style={{ background: 'rgba(10,10,10,0.6)', padding: '0.75rem', borderLeft: '2px solid var(--accent-yellow)' }}>
      <audio controls style={{ width: '100%' }}>
      <source src={version.audio_url} />
      </audio>
      </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <span className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
        {song.versions.filter(v => !v.is_original).length} collaboration{song.versions.filter(v => !v.is_original).length !== 1 ? 's' : ''} · by @{song.originalAuthor} · {formatDate(song.created_at)} · {song.collab_split || 50}% to collaborator{song.is_complete && ' · Ready for distribution'}
      </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {expanded && !song.is_complete && (user ? (
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setShowRemix(!showRemix) }}>
                {showRemix ? 'Cancel' : '+ Add Your Version'}
              </button>
            ) : (
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onAuthRequired() }}>+ Add Your Version</button>
            ))}
            {song.versions.filter(v => !v.is_original).length > 0 && (
              <button className="btn btn-sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Collapse ↑' : 'View ↓'}
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <>
            <div style={{ marginTop: '1.25rem' }}>
              {song.versions.filter(v => !v.is_original).map(version => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onLike={() => toggleLike(version.id, version.likeCount)}
                  canLike={!!user}
                />
              ))}
            </div>
            {showRemix && (
              <RemixForm
            songId={song.id}
            isComplete={song.is_complete}
            onSuccess={() => { setShowRemix(false); onUpdate() }}
            onCancel={() => setShowRemix(false)}
            />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function VersionItem({ version, onLike, canLike }) {
  return (
    <div style={{
      background: 'rgba(10,10,10,0.6)',
      padding: '1.25rem',
      marginBottom: '0.75rem',
      borderLeft: `2px solid ${version.is_original ? 'var(--accent-yellow)' : 'var(--muted-red)'}`,
      position: 'relative',
      ...(version.is_original ? { background: 'rgba(255,200,87,0.07)' } : {})
    }}>
      {version.is_original && (
  <span className="mono" style={{ position: 'absolute', top: '0.5rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--accent-yellow)', background: 'var(--deep-black)', padding: '0.15rem 0.4rem', letterSpacing: 1 }}>
    ORIGINAL
  </span>
)}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div className="mono" style={{ fontSize: '0.85rem' }}>
          {!version.is_original && (
            <span style={{ color: 'var(--muted-red)', marginRight: 6 }}>
              [{version.version_type?.toUpperCase() || 'REMIX'}]
            </span>
          )}
          @{version.creator}
          {version.notes && <span style={{ opacity: 0.6 }}> · {version.notes}</span>}
        </div>

        <button
          onClick={onLike}
          disabled={!canLike}
          className="mono"
          style={{
            background: 'transparent',
            border: '1px solid var(--muted-red)',
            color: 'var(--muted-red)',
            padding: '0.3rem 0.8rem',
            cursor: canLike ? 'pointer' : 'default',
            fontSize: '0.85rem',
            fontFamily: 'Space Mono, monospace',
            transition: 'all 0.2s',
          }}
        >
          ♡ {version.likeCount}
        </button>
      </div>

      <div style={{ background: 'var(--deep-black)', padding: '0.75rem', border: '1px solid rgba(255,107,53,0.2)' }}>
        <audio controls style={{ width: '100%' }}>
          <source src={version.audio_url} />
        </audio>
      </div>

      <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.5rem' }}>
        {formatDate(version.created_at)}
      </p>
    </div>
  )
}

function RemixForm({ songId, isComplete, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [versionType, setVersionType] = useState('cowrite')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const f = e.target.files[0]
    if (f && f.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }
    setFile(f)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    setLoading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `songs/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('audio').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

      const { error: versionErr } = await supabase.from('versions').insert({
        song_id: songId,
        user_id: user.id,
        audio_url: publicUrl,
        is_original: false,
        version_type: versionType,
        notes
      })
      if (versionErr) throw versionErr

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'rgba(10,10,10,0.8)', padding: '1.5rem', border: '1px solid var(--burnt-orange)', marginTop: '1rem' }}>
      <h4 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '1rem' }}>Add Your Version</h4>
        <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5, marginBottom: '0.5rem' }}>
      Your work belongs to you regardless of whether it's selected for distribution. If selected, you'll receive a share of the collaborator pool (50% of total royalties), divided equally among all contributors whose work appears in the approved version.
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isComplete && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input type="radio" value="cowrite" checked={versionType === 'cowrite'} onChange={() => setVersionType('cowrite')} />
          <span className="mono" style={{ fontSize: '0.8rem' }}>Co-write</span>
        </label>
        )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="radio" value="cover" checked={versionType === 'cover'} onChange={() => setVersionType('cover')} />
            <span className="mono" style={{ fontSize: '0.8rem' }}>Cover</span>
          </label>
        </div>

        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did you change? (optional)" />

        <div style={{ border: '1px dashed var(--accent-yellow)', padding: '1.25rem', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
          <input type="file" accept="audio/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          <span className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
            {file ? `✓ ${file.name}` : '📼 Upload your version (max 10MB)'}
          </span>
        </div>

        {error && <p className="error">⚠ {error}</p>}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <input type="checkbox" required style={{ marginTop: 4, width: 16, height: 16 }} />
          <span style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>I agree to the 50/50 split on co-writes and standard mechanical rates on covers. Unauthorized independent distribution of this collaboration is a violation of CollabForge terms and may constitute copyright infringement.</span>
        </div>
          
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Uploading...' : 'Submit Version'}
          </button>
          <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str), now = new Date()
  const days = Math.floor((now - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
