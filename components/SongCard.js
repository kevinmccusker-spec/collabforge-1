import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'
import { useState } from 'react'
import Link from 'next/link'

export default function SongCard({ version, songTitle, songId, onUpdate, onAuthRequired }) {
  const { user } = useAuth()
  const [liking, setLiking] = useState(false)

  async function toggleLike() {
    if (!user) { onAuthRequired(); return }
    if (liking) return
    setLiking(true)

    const { data: existing } = await supabase
      .from('version_likes')
      .select('id')
      .eq('version_id', version.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('version_likes').delete().eq('id', existing.id)
    } else {
      await supabase.from('version_likes').insert({ version_id: version.id, user_id: user.id })
    }

    setLiking(false)
    onUpdate()
  }

  function versionLabel() {
    if (version.is_original) return 'Original'
    if (version.version_type === 'cover') return 'Cover'
    return 'Cowrite'
  }

  return (
    <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
      <button
        onClick={toggleLike}
        disabled={liking || version.likedByMe}
        className="mono"
        style={{
          background: version.likedByMe ? 'var(--muted-red)' : 'transparent',
          border: '1px solid var(--muted-red)',
          color: version.likedByMe ? 'var(--cream)' : 'var(--muted-red)',
          padding: '0.3rem 0.7rem',
          cursor: liking ? 'wait' : 'pointer',
          fontSize: '0.85rem',
          fontFamily: 'Space Mono, monospace',
          flexShrink: 0
        }}
      >
        {version.likedByMe ? '♥' : '♡'} {version.likeCount || 0}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/song/${songId}`} style={{ textDecoration: 'none' }}>
          <h2 className="mono" style={{
            fontSize: '1rem',
            color: 'var(--burnt-orange)',
            letterSpacing: '-0.5px',
            marginBottom: '0.2rem',
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {songTitle}
          </h2>
        </Link>
        <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          {versionLabel()} by @{version.creator}
        </p>
      </div>

      <Link href={`/song/${songId}`} className="btn btn-sm" style={{ textDecoration: 'none', flexShrink: 0 }}>
        Studio →
      </Link>
    </div>
  )
}
