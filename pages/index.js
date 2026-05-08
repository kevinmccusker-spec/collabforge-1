import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './_app'
import Header from '../components/Header'
import SongCard from '../components/SongCard'
import AuthModal from '../components/AuthModal'
import UploadModal from '../components/UploadModal'

export default function Home() {
  const { user, profile } = useAuth()
  const [rows, setRows] = useState([]) // each row = a version with song context
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'human' | 'ai'

  useEffect(() => { loadVersions() }, [user])

  async function loadVersions() {
    setLoading(true)

    const { data: songs } = await supabase
      .from('songs')
      .select('id, title')

    const { data: versions } = await supabase
      .from('versions')
      .select('*, version_likes(user_id)')

    if (!songs || !versions) {
      setLoading(false)
      return
    }

    // Build a song lookup
    const songMap = {}
    songs.forEach(s => { songMap[s.id] = s })

    // Get all unique user_ids from versions
    const userIds = [...new Set(versions.map(v => v.user_id))]
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, username')
      .in('id', userIds)

    const profileMap = {}
    ;(profiles || []).forEach(p => { profileMap[p.id] = p })

    // Build the flat list of rows (each = one version)
    const flatRows = versions
      .filter(v => songMap[v.song_id]) // skip orphans
      .map(v => ({
        ...v,
        songTitle: songMap[v.song_id].title,
        creator: profileMap[v.user_id]?.username || '',
        likeCount: v.version_likes?.length || 0,
        likedByMe: user ? v.version_likes?.some(l => l.user_id === user.id) : false
      }))
      .sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
        // Tie: newer first
        return new Date(b.created_at) - new Date(a.created_at)
      })

    setRows(flatRows)
    setLoading(false)
  }

  const filtered = rows.filter(v => {
    const matchesSearch =
      v.songTitle?.toLowerCase().includes(search.toLowerCase()) ||
      v.creator?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'human' && v.ai_disclosure === 'human_made') ||
      (filter === 'ai' && (v.ai_disclosure === 'ai_assisted' || v.ai_disclosure === 'pure_ai'))

    return matchesSearch && matchesFilter
  })

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => setShowAuth(true)}
        onUpload={() => user ? setShowUpload(true) : setShowAuth(true)}
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        <div style={{ marginBottom: '2rem', display: 'grid', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Search by song title or @handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={() => setFilter('all')}
              style={{
                opacity: filter === 'all' ? 1 : 0.5,
                borderColor: filter === 'all' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)'
              }}
            >
              All
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setFilter('human')}
              style={{
                opacity: filter === 'human' ? 1 : 0.5,
                borderColor: filter === 'human' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)'
              }}
            >
              Human-made
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setFilter('ai')}
              style={{
                opacity: filter === 'ai' ? 1 : 0.5,
                borderColor: filter === 'ai' ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)'
              }}
            >
              AI-assisted / Pure AI
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mono" style={{ textAlign: 'center', padding: '4rem', color: 'var(--accent-yellow)' }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            <p className="mono" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {search || filter !== 'all'
                ? 'Nothing matches your search.'
                : 'No songs yet. Be the first to release one to the hive mind.'}
            </p>
            {!user && (
              <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
                Sign In to Upload
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {filtered.map(version => (
              <SongCard
                key={version.id}
                version={version}
                songTitle={version.songTitle}
                songId={version.song_id}
                onUpdate={loadVersions}
                onAuthRequired={() => setShowAuth(true)}
              />
            ))}
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); loadVersions() }}
        />
      )}
    </div>
  )
}
