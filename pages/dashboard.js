import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './_app'
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import UploadModal from '../components/UploadModal'
import Link from 'next/link'

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const [songs, setSongs] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: songsData }, { data: versionsData }] = await Promise.all([
      supabase
        .from('songs')
        .select('*, versions(id, version_likes(count))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('versions')
        .select('*, songs(title, user_id, profiles:user_id(username)), version_likes(count)')
        .eq('user_id', user.id)
        .eq('is_original', false)
        .order('created_at', { ascending: false })
    ])
    setSongs(songsData || [])
    setVersions(versionsData || [])
    setLoading(false)
  }

  if (authLoading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--accent-yellow)' }}>Loading...</div>

  if (!user) return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header onSignIn={() => setShowAuth(true)} onUpload={() => setShowAuth(true)} />
      <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <p className="mono" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.7 }}>Sign in to view your dashboard</p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )

  const totalLikes = songs.reduce((acc, s) => acc + (s.versions?.reduce((a, v) => a + (v.version_likes?.[0]?.count || 0), 0) || 0), 0)

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => setShowAuth(true)}
        onUpload={() => setShowUpload(true)}
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { label: 'Songs Released', value: songs.length },
            { label: 'Versions Created', value: versions.length },
            { label: 'Total Likes', value: totalLikes },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--warm-grey)', padding: '1.5rem', borderLeft: '3px solid var(--burnt-orange)', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '2rem', color: 'var(--burnt-orange)', marginBottom: '0.25rem' }}>{stat.value}</div>
              <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Songs */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem' }}>My Songs</h2>
            <button className="btn btn-sm btn-primary" onClick={() => setShowUpload(true)}>+ Upload New</button>
          </div>

          {songs.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No songs released yet. Let something go.</p>
          ) : songs.map(song => (
            <div key={song.id} style={{ background: 'var(--warm-grey)', borderLeft: `4px solid ${song.is_complete ? 'var(--accent-yellow)' : 'var(--burnt-orange)'}`, padding: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '0.25rem' }}>{song.title}</p>
                <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {song.versions?.length || 0} versions Â·
                  {song.is_complete ? ' âœ“ Complete' : ' In progress'}
                </p>
              </div>
              <Link href={`/#${song.id}`} className="btn btn-sm">View â†’</Link>
            </div>
          ))}
        </section>

        {/* My Remixes */}
        <section>
          <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>My Remixes</h2>
          {versions.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No remixes yet. Find a song that speaks to you.</p>
          ) : versions.map(v => (
            <div key={v.id} style={{ background: 'var(--warm-grey)', borderLeft: '4px solid var(--muted-red)', padding: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="mono" style={{ color: 'var(--muted-red)', marginBottom: '0.25rem' }}>
                  [{v.version_type?.toUpperCase() || 'REMIX'}] {v.songs?.title}
                </p>
                <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {v.version_likes?.[0]?.count || 0} likes Â· original by @{v.songs?.profiles?.username}
                </p>
              </div>
              <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>{v.notes || 'â€”'}</span>
            </div>
          ))}
        </section>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadData() }} />}
    </div>
  )
}
