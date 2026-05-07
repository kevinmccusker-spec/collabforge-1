import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../_app'
import Header from '../../components/Header'
import AuthModal from '../../components/AuthModal'

export default function SongPlacard() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()
  const [song, setSong] = useState(null)
  const [versions, setVersions] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRecord, setShowRecord] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authReason, setAuthReason] = useState(null)
  const [liking, setLiking] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [submittingComment, setSubmittingComment] = useState({})

  useEffect(() => {
    if (id) loadSong()
  }, [id, user])

  async function loadSong() {
    const { data: songData } = await supabase
      .from('songs')
      .select('*, public_profiles:user_id(username)')
      .eq('id', id)
      .single()

    if (!songData) { router.push('/'); return }

    const { data: versionsData } = await supabase
      .from('versions')
      .select('*, public_profiles:user_id(username), version_likes(user_id)')
      .eq('song_id', id)
      .order('created_at', { ascending: true })

    const enriched = (versionsData || []).map(v => ({
      ...v,
      likeCount: v.version_likes?.length || 0,
      likedByMe: user ? v.version_likes?.some(l => l.user_id === user.id) : false
    }))

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('song_id', id)
      .not('version_id', 'is', null)
      .order('created_at', { ascending: false })

    setSong(songData)
    setVersions(enriched)
    setComments(commentsData || [])
    setLoading(false)
  }

  async function toggleLike(versionId) {
    if (!user) {
      setAuthReason('vote')
      setShowAuth(true)
      return
    }
    if (liking) return
    setLiking(true)

    const { data: existing } = await supabase
      .from('version_likes')
      .select('id')
      .eq('version_id', versionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('version_likes').delete().eq('id', existing.id)
    } else {
      await supabase.from('version_likes').insert({ version_id: versionId, user_id: user.id })
    }

    setLiking(false)
    loadSong()
  }

  async function submitComment(versionId) {
    if (!user) {
      setAuthReason('comment')
      setShowAuth(true)
      return
    }
    if (!profile?.username) return // handle gate — UI shows fallback
    const body = (commentDrafts[versionId] || '').trim()
    if (!body) return

    setSubmittingComment(prev => ({ ...prev, [versionId]: true }))
    await supabase.from('comments').insert({
      song_id: id,
      version_id: versionId,
      user_id: user.id,
      username: profile.username,
      body
    })
    setCommentDrafts(prev => ({ ...prev, [versionId]: '' }))
    setSubmittingComment(prev => ({ ...prev, [versionId]: false }))
    loadSong()
  }

  async function deleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    loadSong()
  }

  function getChainDepth(version, allVersions) {
    let depth = 0
    let current = version
    while (current?.parent_version_id) {
      const parent = allVersions.find(v => v.id === current.parent_version_id)
      if (!parent) break
      depth++
      current = parent
    }
    return depth
  }

  function disclosureLabel(disclosure) {
    if (disclosure === 'human_made') return 'HUMAN'
    if (disclosure === 'ai_assisted') return 'AI-ASSISTED'
    if (disclosure === 'pure_ai') return 'PURE AI'
    return 'HUMAN'
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--accent-yellow)' }}>Loading...</div>

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => { setAuthReason(null); setShowAuth(true) }}
        onUpload={() => { if (!user) { setAuthReason(null); setShowAuth(true) } else { router.push('/') } }}
      />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>

        {/* Song Header */}
        <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 2 }}>Studio</p>
        <div style={{ borderLeft: '4px solid var(--burnt-orange)', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <h1 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>{song.title}</h1>
          <p className="mono" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
            Original by @{song.public_profiles?.username} · {new Date(song.created_at).toLocaleDateString()} · {disclosureLabel(song.ai_disclosure)}
          </p>
          {song.description && <p style={{ marginTop: '0.75rem', opacity: 0.8 }}>{song.description}</p>}
        </div>

        {/* Versions / Chain */}
        <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Contribution Record</h2>

        {versions.map(version => {
          const depth = getChainDepth(version, versions)
          const indent = depth * 24
          const versionComments = comments.filter(c => c.version_id === version.id)
          return (
            <div key={version.id} style={{
              background: 'var(--warm-grey)',
              borderLeft: `4px solid ${version.is_original ? 'var(--accent-yellow)' : 'var(--burnt-orange)'}`,
              padding: '1.25rem',
              marginBottom: '1rem',
              marginLeft: `${indent}px`,
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p className="mono" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {version.is_original ? '★ ORIGINAL' : `[${version.version_type?.toUpperCase() || 'COWRITE'}]`}
                    {' '}@{version.public_profiles?.username}
                    {' · '}<span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{disclosureLabel(version.ai_disclosure)}</span>
                  </p>
                  <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    {new Date(version.created_at).toLocaleString()}
                    {depth > 0 && <span style={{ marginLeft: '0.5rem' }}>· built on a previous version</span>}
                  </p>
                  {version.contribution_notes && (
                    <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem', fontStyle: 'italic' }}>
                      "{version.contribution_notes}"
                    </p>
                  )}
                  {version.notes && <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>{version.notes}</p>}
                </div>
              </div>

              {version.is_original && song.content_type === 'lyrics' ? (
                <>
                  <div style={{
                    background: 'rgba(255,200,87,0.05)',
                    padding: '1.5rem',
                    marginTop: '0.75rem',
                    fontFamily: 'Georgia, serif',
                    fontSize: '1rem',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    color: 'var(--cream)',
                    fontStyle: 'italic'
                  }}>
                    {song.lyrics_text}
                  </div>
                  <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(song.lyrics_text)}
                      className="mono"
                      style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--accent-yellow)', cursor: 'pointer', opacity: 0.7 }}
                    >
                      📋 Copy lyrics
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <audio controls style={{ width: '100%', marginTop: '0.75rem' }}>
                    <source src={version.audio_url} />
                  </audio>
                  <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                    <a href={version.audio_url} download className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', textDecoration: 'none', opacity: 0.7 }}>
                      ↓ Download
                    </a>
                  </div>
                </>
              )}

              {/* Like + comment count bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => toggleLike(version.id)}
                  disabled={liking}
                  className="mono"
                  style={{
                    background: version.likedByMe ? 'var(--muted-red)' : 'transparent',
                    border: '1px solid var(--muted-red)',
                    color: version.likedByMe ? 'var(--cream)' : 'var(--muted-red)',
                    padding: '0.3rem 0.8rem',
                    cursor: liking ? 'wait' : 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: 'Space Mono, monospace',
                    transition: 'all 0.2s'
                  }}
                >
                  {version.likedByMe ? '♥' : '♡'} {version.likeCount}
                </button>
                <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                  💬 {versionComments.length}
                </span>
              </div>

              {/* Comments thread for this version */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,107,53,0.15)', paddingTop: '0.75rem' }}>
                {versionComments.map(c => (
                  <div key={c.id} style={{ marginBottom: '0.6rem', borderLeft: '2px solid rgba(255,107,53,0.3)', paddingLeft: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', marginBottom: '0.15rem' }}>
                        @{c.username}
                        <span style={{ marginLeft: '0.5rem', opacity: 0.5 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      </p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>{c.body}</p>
                    </div>
                    {user && c.user_id === user.id && (
                      <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--muted-red)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Space Mono, monospace', opacity: 0.6 }}>✕</button>
                    )}
                  </div>
                ))}

                {/* Comment input — handle-gated */}
                {user && !profile?.username ? (
                  <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Set a handle on your profile to comment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <textarea
                      value={commentDrafts[version.id] || ''}
                      onChange={e => setCommentDrafts(prev => ({ ...prev, [version.id]: e.target.value }))}
                      onFocus={() => { if (!user) { setAuthReason('comment'); setShowAuth(true) } }}
                      placeholder="Leave a comment on this version..."
                      rows={2}
                      style={{ flex: 1, resize: 'vertical', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => submitComment(version.id)}
                      className="btn btn-sm"
                      disabled={submittingComment[version.id]}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      {submittingComment[version.id] ? '...' : 'Post'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Contribution Record button */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => setShowRecord(true)}>+ Record</button>
          <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>Lineage of contributions on this song</span>
        </div>

        {/* Distribution buttons */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '2rem' }}>
          <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Distribute Your Version</h2>
          <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1rem' }}>Anyone in the chain can release their version. Use the Record above for split sheet info.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://distrokid.com/vip/seven/12298562" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">DistroKid</a>
            <a href="https://tunecore.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">TuneCore</a>
            <a href="https://cdbaby.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">CD Baby</a>
          </div>
        </div>

        {/* Contribution Record Modal */}
        {showRecord && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: '#1a1a1a', border: '1px solid var(--burnt-orange)', maxWidth: 600, width: '100%', padding: '2.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowRecord(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--cream)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>

              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: 2, marginBottom: '1rem' }}>COLLABFORGE.IO · CONTRIBUTION RECORD</p>
              <h2 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>{song.title}</h2>
              <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '2rem' }}>
                Original by @{song.public_profiles?.username} · {new Date(song.created_at).toLocaleDateString()} · {disclosureLabel(song.ai_disclosure)}
              </p>

              <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Lineage</p>

              {versions.map(version => {
                const depth = getChainDepth(version, versions)
                const chainLength = depth + 1
                return (
                  <div key={version.id} style={{
                    borderLeft: `2px solid ${version.is_original ? 'var(--accent-yellow)' : 'var(--burnt-orange)'}`,
                    paddingLeft: '1rem',
                    marginLeft: `${depth * 16}px`,
                    marginBottom: '1rem'
                  }}>
                    <p className="mono" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      {version.is_original ? '★ ORIGINAL' : `[${version.version_type?.toUpperCase()}]`} @{version.public_profiles?.username}
                      {' · '}<span style={{ opacity: 0.6, fontSize: '0.7rem' }}>{disclosureLabel(version.ai_disclosure)}</span>
                    </p>
                    <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(version.created_at).toLocaleString()}</p>
                    {version.contribution_notes && (
                      <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem', fontStyle: 'italic' }}>"{version.contribution_notes}"</p>
                    )}
                    {!version.is_original && (
                      <p className="mono" style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--accent-yellow)' }}>
                        Chain depth: {depth} · Equal split among {chainLength + 1} contributors
                      </p>
                    )}
                  </div>
                )
              })}

              <p className="mono" style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '2rem', lineHeight: 1.6 }}>
                This is a timestamped record of contributions on CollabForge.io. The original artist is always at the root. Splits are equal among all contributors in a given version's chain. Use this record to fill out split sheets when distributing through DistroKid, CD Baby, or TuneCore. CollabForge records lineage but does not enforce splits or arbitrate disputes.
              </p>

              <button className="btn btn-sm" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>Print / Save PDF</button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuth && (
          <AuthModal
            onClose={() => { setShowAuth(false); setAuthReason(null); loadSong() }}
            reason={authReason}
          />
        )}

      </main>
    </div>
  )
}
