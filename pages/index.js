import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './_app'
import Header from '../components/Header'
import SongCard from '../components/SongCard'
import AuthModal from '../components/AuthModal'
import UploadModal from '../components/UploadModal'

export default function Home() {
  const { user, profile } = useAuth()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { loadSongs() }, [])

  async function loadSongs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        profiles:user_id(username),
        versions(
          *,
          profiles:user_id(username),
          version_likes(count)
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const formatted = data.map(song => ({
        ...song,
        originalAuthor: song.profiles?.username,
        versions: (song.versions || [])
          .map(v => ({
            ...v,
            creator: v.profiles?.username,
            likeCount: v.version_likes?.[0]?.count || 0
          }))
          .sort((a, b) => {
            if (a.is_original) return -1
            if (b.is_original) return 1
            return b.likeCount - a.likeCount
          })
      }))
      setSongs(formatted)
    }
    setLoading(false)
  }

  const filtered = songs.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => setShowAuth(true)}
        onUpload={() => user ? setShowUpload(true) : setShowAuth(true)}
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {/* Search */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search songs by title or mood..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Songs */}
        {loading ? (
          <div className="mono" style={{ textAlign: 'center', padding: '4rem', color: 'var(--accent-yellow)' }}>
            Loading songs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            <p className="mono" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {search ? 'No songs match your search.' : 'No songs yet. Be the first to let go.'}
            </p>
            {!user && (
              <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
                Sign In to Upload
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2.5rem' }}>
            {filtered.map(song => (
              <SongCard
                key={song.id}
                song={song}
                onUpdate={loadSongs}
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
          onSuccess={() => { setShowUpload(false); loadSongs() }}
        />
      )}
    </div>
  )
}
