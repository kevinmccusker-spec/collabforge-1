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
  const [filter, setFilter] = useState('all') // 'all' | 'human' | 'ai'

  useEffect(() => { loadSongs() }, [])

  async function loadSongs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
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
        originalAuthor: song.username,
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

  const filtered = songs.filter(s => {
    const matchesSearch =
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'human' && s.ai_disclosure === 'human_made') ||
      (filter === 'ai' && (s.ai_disclosure === 'ai_assisted' || s.ai_disclosure === 'pure_ai'))

    return matchesSearch && matchesFilter
  })

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => setShowAuth(true)}
        onUpload={() => user ? setShowUpload(true) : setShowAuth(true)}
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* Search and filter */}
        <div style={{ marginBottom: '2rem', display: 'grid', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Search songs by title or mood..."
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

        {/* Songs */}
        {loading ? (
          <div className="mono" style={{ textAlign: 'center', padding: '4rem', color: 'var(--accent-yellow)' }}>
            Loading songs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            <p className="mono" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {search || filter !== 'all'
                ? 'No songs match your search.'
                : 'No songs yet. Be the first to release one to the hive mind.'}
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
          onClose={() => set
