import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../_app'
import Header from '../../components/Header'

export default function SongPlacard() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [song, setSong] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCollaborator, setIsCollaborator] = useState(false)

  useEffect(() => {
    if (id) loadSong()
  }, [id, user])

  async function loadSong() {
    const { data: songData } = await supabase
      .from('songs')
      .select('*, profiles:user_id(username)')
      .eq('id', id)
      .single()

    if (!songData) { router.push('/'); return }

    const { data: versionsData } = await supabase
      .from('versions')
      .select('*, profiles:user_id(username)')
      .eq('song_id', id)
      .order('created_at', { ascending: true })

    const isOriginalArtist = user ? songData.user_id === user.id : false

    setSong({ ...songData, isOriginalArtist })
    setVersions(versionsData || [])
    setIsCollaborator(versionsData?.some(v => v.user_id === user?.id && !v.is_original) || false)
    setLoading(false)
  }

  async function approveVersion(versionId) {
    await supabase.from('versions').update({ approved: true }).eq('id', versionId)
    loadSong()
  }

  async function rejectVersion(versionId) {
    await supabase.from('versions').update({ approved: false }).eq('id', versionId)
    loadSong()
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--accent-yellow)' }}>Loading...</div>

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header onSignIn={() => {}} onUpload={() => {}} />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>

        {/* Song Header */}
      <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 2 }}>Studio</p> 
      <div style={{ borderLeft: '4px solid var(--burnt-orange)', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <h1 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>{song.title}</h1>
          <p className="mono" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
            Original by @{song.profiles?.username} · {new Date(song.created_at).toLocaleDateString()} · {song.collab_split || 50}% split offered
          </p>
          {song.description && <p style={{ marginTop: '0.75rem', opacity: 0.8 }}>{song.description}</p>}
        </div>

        {/* Versions */}
        <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Collaboration Record</h2>

        {versions.map(version => (
          <div key={version.id} style={{
            background: 'var(--warm-grey)',
            borderLeft: `4px solid ${version.is_original ? 'var(--accent-yellow)' : version.approved ? 'var(--burnt-orange)' : 'rgba(255,107,53,0.3)'}`,
            padding: '1.25rem',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="mono" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  {version.is_original ? '★ ORIGINAL' : `[${version.version_type?.toUpperCase() || 'COWRITE'}]`}
                  {' '}@{version.profiles?.username}
                </p>
                <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                  Uploaded {new Date(version.created_at).toLocaleString()}
                </p>
                {version.notes && <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>{version.notes}</p>}
                {!version.is_original && (
                  <p className="mono" style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: version.approved ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.3)' }}>
                    {version.approved === true ? '✓ APPROVED FOR DISTRIBUTION' : version.approved === false ? '✗ NOT SELECTED' : '— PENDING REVIEW'}
                  </p>
                )}
              </div>

              {song.isOriginalArtist && !version.is_original && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm" onClick={() => approveVersion(version.id)}
                    style={{ color: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow)' }}>
                    Approve
                  </button>
                  <button className="btn btn-sm" onClick={() => rejectVersion(version.id)}
                    style={{ color: 'var(--muted-red)', borderColor: 'var(--muted-red)' }}>
                    Reject
                  </button>
                </div>
              )}
            </div>

            <audio controls style={{ width: '100%', marginTop: '0.75rem' }}>
              <source src={version.audio_url} />
            </audio>
          </div>
        ))}
        {(song.isOriginalArtist || isCollaborator) && (
  <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '2rem' }}>
    <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Placard</h2>
    <button className="btn btn-sm" onClick={() => window.print()}>
      Download Placard
    </button>
    <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem' }}>
      Timestamped record of creative contributions made on CollabForge.io
    </p>
  </div>
)}
        {/* Distribution Actions — original artist only */}
        {song.isOriginalArtist && song.is_complete && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '2rem' }}>
            <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Distribution</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="https://landr.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                Master via LANDR
              </a>
              <a href="https://distrokid.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                Distribute via DistroKid
              </a>
              <a href="https://tunecore.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                Distribute via TuneCore
              </a>
              <a href="https://cdbaby.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                Distribute via CD Baby
              </a>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
