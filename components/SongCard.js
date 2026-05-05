import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'

export default function SongCard({ song, onUpdate, onAuthRequired }) {
  const { user, profile } = useAuth()
  const [showRemixFor, setShowRemixFor] = useState(null) // null | 'original' | versionId
  const [liking, setLiking] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (expanded) loadComments()
  }, [expanded])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('song_id', song.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    loadComments()
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!user) { onAuthRequired(); return }
    if (!commentBody.trim()) return
    setSubmittingComment(true)
    await supabase.from('comments').insert({
      song_id: song.id,
      user_id: user.id,
      username: profile?.username || user.email?.split('@')[0],
      body: commentBody.trim()
    })
    setCommentBody('')
    loadComments()
    setSubmittingComment(false)
  }

  async function toggleLike(versionId) {
    if (!user) { onAuthRequired(); return }
    if (liking) return
    setLiking(true)

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

  function handleBuildFrom(parentId) {
    if (!user) { onAuthRequired(); return }
    setShowRemixFor(parentId)
  }

  function disclosureLabel(d) {
    if (d === 'human_made') return 'HUMAN'
    if (d === 'ai_assisted') return 'AI-ASSISTED'
    if (d === 'pure_ai') return 'PURE AI'
    return 'HUMAN'
  }

  function disclosureColor(d) {
    if (d === 'human_made') return 'var(--accent-yellow)'
    if (d === 'ai_assisted') return 'var(--burnt-orange)'
    if (d === 'pure_ai') return 'var(--muted-red)'
    return 'var(--accent-yellow)'
  }

  const collaborations = song.versions.filter(v => !v.is_original).length

  return (
    <div className="card fade-in">
      {/* AI disclosure badge */}
      <div className="mono" style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        fontSize: '0.65rem',
        color: disclosureColor(song.ai_disclosure),
        background: 'var(--deep-black)',
        padding: '0.25rem 0.6rem',
        border: `1px solid ${disclosureColor(song.ai_disclosure)}`,
        letterSpacing: 1
      }}>
        {disclosureLabel(song.ai_disclosure)}
      </div>

      {/* Song Header */}
      <div style={{ marginBottom: '0.5rem', paddingRight: '6rem' }}>
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
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <a href={version.audio_url} download className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', textDecoration: 'none', opacity: 0.7 }}>
                ↓ Download to build from
              </a>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
            {collaborations} version{collaborations !== 1 ? 's' : ''} · by @{song.originalAuthor} · {formatDate(song.created_at)}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {expanded && (
              <button
                className="btn btn-sm"
                onClick={e => { e.stopPropagation(); handleBuildFrom('original') }}
              >
                + Build From Original
              </button>
            )}
            <button className="btn btn-sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Collapse ↑' : 'View ↓'}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            {/* Remix form for original */}
            {showRemixFor === 'original' && (
              <RemixForm
                songId={song.id}
                parentVersionId={null}
                onSuccess={() => { setShowRemixFor(null); onUpdate() }}
                onCancel={() => setShowRemixFor(null)}
              />
            )}

            <div style={{ marginTop: '1.25rem' }}>
              {song.versions.filter(v => !v.is_original).map(version => (
                <div key={version.id}>
                  <VersionItem
                    version={version}
                    onLike={() => toggleLike(version.id)}
                    onBuildFrom={() => handleBuildFrom(version.id)}
                    canLike={!!user}
                    disclosureLabel={disclosureLabel}
                    disclosureColor={disclosureColor}
                  />
                  {showRemixFor === version.id && (
                    <RemixForm
                      songId={song.id}
                      parentVersionId={version.id}
                      onSuccess={() => { setShowRemixFor(null); onUpdate() }}
                      onCancel={() => setShowRemixFor(null)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Comments */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,107,53,0.2)', paddingTop: '1rem' }}>
              <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                {song.needs_music ? 'Suggest Lyrics or Leave a Comment' : 'Comments'}
              </p>

              {comments.map(c => (
                <div key={c.id} style={{ marginBottom: '0.75rem', borderLeft: '2px solid rgba(255,107,53,0.3)', paddingLeft: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginBottom: '0.2rem' }}>@{c.username}</p>
                    <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>{c.body}</p>
                  </div>
                  {user && c.user_id === user.id && (
                    <button onClick={() => { if (window.confirm('Delete this comment?')) deleteComment(c.id) }} style={{ background: 'none', border: 'none', color: 'var(--muted-red)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Space Mono, monospace', opacity: 0.6 }}>✕</button>
                  )}
                </div>
              ))}

              <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder={song.needs_music ? 'Suggest lyrics or finish a line...' : 'Leave a comment...'}
                  rows={2}
                  style={{ flex: 1, resize: 'vertical', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-sm" disabled={submittingComment} style={{ alignSelf: 'flex-end' }}>
                  {submittingComment ? '...' : 'Post'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VersionItem({ version, onLike, onBuildFrom, canLike, disclosureLabel, disclosureColor }) {
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="mono" style={{ fontSize: '0.85rem' }}>
          {!version.is_original && (
            <span style={{ color: 'var(--muted-red)', marginRight: 6 }}>
              [{version.version_type?.toUpperCase() || 'REMIX'}]
            </span>
          )}
          @{version.creator}
          <span style={{ marginLeft: 6, color: disclosureColor(version.ai_disclosure), fontSize: '0.7rem' }}>
            · {disclosureLabel(version.ai_disclosure)}
          </span>
          {version.contribution_notes && (
            <span style={{ opacity: 0.6, fontStyle: 'italic' }}> · "{version.contribution_notes}"</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          {!version.is_original && (
            <button
              onClick={onBuildFrom}
              className="btn btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              + Build From This
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--deep-black)', padding: '0.75rem', border: '1px solid rgba(255,107,53,0.2)' }}>
        <audio controls style={{ width: '100%' }}>
          <source src={version.audio_url} />
        </audio>
        <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
          <a href={version.audio_url} download className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', textDecoration: 'none', opacity: 0.7 }}>
            ↓ Download
          </a>
        </div>
      </div>

      <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.5rem' }}>
        {formatDate(version.created_at)}
      </p>
    </div>
  )
}

function RemixForm({ songId, parentVersionId, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [contributionNotes, setContributionNotes] = useState('')
  const [versionType, setVersionType] = useState('cowrite')
  const [aiDisclosure, setAiDisclosure] = useState('human_made')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const f = e.target.files[0]
    if (f && f.size > 10 * 1024 * 1024) { setError('File must be under 50MB'); return }
    setFile(f)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    if (!contributionNotes.trim()) { setError('Briefly describe what you contributed'); return }
    setLoading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `songs/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('audio').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

      const { error: versionErr } = await supabase.from('versions').insert({
        song_id: songId,
        parent_song_id: songId,
        parent_version_id: parentVersionId,
        user_id: user.id,
        audio_url: publicUrl,
        is_original: false,
        version_type: versionType,
        ai_disclosure: aiDisclosure,
        contribution_notes: contributionNotes.trim(),
        notes: ''
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
      <h4 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '0.5rem' }}>
        {parentVersionId ? 'Build From This Version' : 'Build From Original'}
      </h4>
      <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5, marginBottom: '1rem' }}>
        Your version will be added to the chain. Splits are equal among everyone in the chain — original artist always at the root. The Contribution Record will reflect your addition.
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="radio" value="cowrite" checked={versionType === 'cowrite'} onChange={() => setVersionType('cowrite')} />
            <span className="mono" style={{ fontSize: '0.8rem' }}>Co-write</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="radio" value="cover" checked={versionType === 'cover'} onChange={() => setVersionType('cover')} />
            <span className="mono" style={{ fontSize: '0.8rem' }}>Cover</span>
          </label>
        </div>

        <div>
          <label className="mono" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem', opacity: 0.7 }}>What did you contribute? *</label>
          <input
            type="text"
            value={contributionNotes}
            onChange={e => setContributionNotes(e.target.value)}
            placeholder="e.g. added vocals, rewrote bridge, electronic remix"
            required
          />
        </div>

        <div>
          <label className="mono" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem', opacity: 0.7 }}>How was this made? *</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="human_made" checked={aiDisclosure === 'human_made'} onChange={() => setAiDisclosure('human_made')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>Human</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="ai_assisted" checked={aiDisclosure === 'ai_assisted'} onChange={() => setAiDisclosure('ai_assisted')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>AI-assisted</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="pure_ai" checked={aiDisclosure === 'pure_ai'} onChange={() => setAiDisclosure('pure_ai')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>Pure AI</span>
            </label>
          </div>
        </div>

        <div style={{ border: '1px dashed var(--accent-yellow)', padding: '1.25rem', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
          <input type="file" accept="audio/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          <span className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
            {file ? `✓ ${file.name}` : '📼 Upload your version (max 50MB)'}
          </span>
        </div>

        {error && <p className="error">⚠ {error}</p>}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <input type="checkbox" required style={{ marginTop: 4, width: 16, height: 16 }} />
          <span style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>
            I understand splits are equal among the chain, and I'm responsible for any mechanical licenses required for cover material. The Contribution Record reflects the lineage; the platform does not arbitrate.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Uploading...' : 'Add to Chain'}
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
