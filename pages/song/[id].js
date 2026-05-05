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
  const [showRecord, setShowRecord] = useState(false)

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

    setSong(songData)
    setVersions(versionsData || [])
    setLoading(false)
  }

  // Compute chain depth for each version by walking parent_version_id back to null
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

  // Build the full ancestry chain for a version (used in placard)
  function getChain(version, allVersions) {
    const chain = [version]
    let current = version
    while (current?.parent_version_id) {
      const parent = allVersions.find(v => v.id === current.parent_version_id)
      if (!parent) break
      chain.unshift(parent)
      current = parent
    }
    return chain
  }

  // AI disclosure display label
  function disclosureLabel(disclosure) {
    if (disclosure === 'human_made') return 'HUMAN'
    if (disclosure === 'ai_assisted') return 'AI-ASSISTED'
    if (disclosure === 'pure_ai') return 'PURE AI'
    return 'HUMAN'
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
            Original by @{song.profiles?.username} · {new Date(song.created_at).toLocaleDateString()} · {disclosureLabel(song.ai_disclosure)}
          </p>
          {song.description && <p style={{ marginTop: '0.75rem', opacity: 0.8 }}>{song.description}</p>}
        </div>

        {/* Versions / Chain */}
        <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Contribution Record</h2>

        {versions.map(version => {
          const depth = getChainDepth(version, versions)
          const indent = depth * 24
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
                    {' '}@{version.profiles?.username}
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

              <audio controls style={{ width: '100%', marginTop: '0.75rem' }}>
                <source src={version.audio_url} />
              </audio>
              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <a href={version.audio_url} download className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', textDecoration: 'none', opacity: 0.7 }}>
                  ↓ Download
                </a>
              </div>
            </div>
          )
        })}

        {/* Contribution Record + Distribution always available */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,107,53,0.25)', paddingTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => setShowRecord(true)}>+ Record</button>
          <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>Lineage of contributions on this song</span>
        </div>

        {/* Distribution buttons — always available now */}
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
                Original by @{song.profiles?.username} · {new Date(song.created_at).toLocaleDateString()} · {disclosureLabel(song.ai_disclosure)}
              </p>

              <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Lineage</p>

              {versions.map(version => {
                const depth = getChainDepth(version, versions)
                const chainLength = depth + 1 // +1 for the original song itself in the chain
                const splitPercent = Math.round(100 / (chainLength + 1)) // +1 because original artist is always in the split
                return (
                  <div key={version.id} style={{
                    borderLeft: `2px solid ${version.is_original ? 'var(--accent-yellow)' : 'var(--burnt-orange)'}`,
                    paddingLeft: '1rem',
                    marginLeft: `${depth * 16}px`,
                    marginBottom: '1rem'
                  }}>
                    <p className="mono" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      {version.is_original ? '★ ORIGINAL' : `[${version.version_type?.toUpperCase()}]`} @{version.profiles?.username}
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

      </main>
    </div>
  )
}
