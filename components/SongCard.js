import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'
import { useState } from 'react'
import Link from 'next/link'

export default function SongCard({ song, onUpdate, onAuthRequired }) {
  const { user } = useAuth()
  const [liking, setLiking] = useState(false)

  // Find the original version for the heart count
  const original = song.versions.find(v => v.is_original)
  const versionCount = song.versions.length

  async function toggleLikeOriginal() {
    if (!user) { onAuthRequired(); return }
    if (liking || !original) return
    setLiking(true)

    const { data: existing } = await supabase
      .from('version_likes')
      .select('id')
      .eq('version_id', original.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('version_likes').delete().eq('id', existing.id)
    } else {
      await supabase.from('version_likes').insert({ version_id: original.id, user_id: user.id })
    }

    setLiking(false)
    onUpdate()
  }

  return (
    <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
      <button
        onClick={toggleLikeOriginal}
        disabled={liking}
        className="mono"
        style={{
          background: 'transparent',
          border: '1px solid var(--muted-red)',
          color: 'var(--muted-red)',
          padding: '0.3rem 0.7rem',
          cursor: liking ? 'wait' : 'pointer',
          fontSize: '0.85rem',
          fontFamily: 'Space Mono, monospace',
          flexShrink: 0
        }}
      >
        ♡ {original?.likeCount || 0}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/song/${song.id}`} style={{ textDecoration: 'none' }}>
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
            {song.title}
          </h2>
        </Link>
        <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          @{song.originalAuthor} · {versionCount} version{versionCount !== 1 ? 's' : ''}
        </p>
      </div>

      <Link href={`/song/${song.id}`} className="btn btn-sm" style={{ textDecoration: 'none', flexShrink: 0 }}>
        Studio →
      </Link>
    </div>
  )
}
