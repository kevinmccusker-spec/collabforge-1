import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../_app'
import Header from '../../components/Header'
import AuthModal from '../../components/AuthModal'
import UploadModal from '../../components/UploadModal'
import Link from 'next/link'

export default function PublicProfile() {
  const router = useRouter()
  const { username } = router.query
  const { user, profile: myProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [songs, setSongs] = useState([])
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (username) loadProfile()
  }, [username])

  async function loadProfile() {
    setLoading(true)
    setNotFound(false)

    // Look up the profile by username (case-insensitive)
    const { data: profileData } = await supabase
      .from('public_profiles')
      .select('id, username, bio')
      .ilike('username', username)
      .maybeSingle()

    if (!profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Songs they uploaded as originals
    const { data: songsData } = await supabase
      .from('songs')
      .select('id, title, ai_disclosure, created_at, versions!versions_song_id_fkey(id, version_likes(count))')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })

    // Versions they created on other people's songs (cowrites + covers)
    const { data: versionsData } = await supabase
      .from('versions')
      .select('id, song_id, version_type, ai_disclosure, contribution_notes, created_at, version_likes(count), songs!versions_song_id_fkey(title, user_id)')
      .eq('user_id', profileData.id)
      .eq('is_original', false)
      .order('created_at', { ascending: false })

    // Get usernames of song originators for the contributions
    const originatorIds = [...new Set((versionsData || []).map(v => v.songs?.user_id).filter(Boolean))]
    let originatorMap = {}
    if (originatorIds.length > 0) {
      const { data: originators } = await supabase
        .from('public_profiles')
        .select('id, username')
        .in('id', originatorIds)
      ;(originators || []).forEach(o => { originatorMap[o.id] = o.username })
    }

    const enrichedContributions = (versionsData || []).map(v => ({
      ...v,
      originalAuthor: v.songs?.user_id ? originatorMap[v.songs.user_id] : null,
      likeCount: v.version_likes?.[0]?.count || 0
    }))

    setProfile(profileData)
    setSongs(songsData || [])
    setContributions(enrichedContributions)
    setLoading(false)
  }

  function disclosureLabel(d) {
    if (d === 'human_made') return 'HUMAN'
    if (d === 'ai_assisted') return 'AI-ASSISTED'
    if (d === 'pure_ai') return 'PURE AI'
    return 'HUMAN'
  }

  function versionLabel(v) {
    if (v.version_type === 'cover') return 'Cover'
    return 'Cowrite'
  }

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--accent-yellow)' }}>Loading...</div>
  }

  if (notFound) {
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header onSignIn={() => setShowAuth(true)} onUpload={() => user ? setShowUpload(true) : setShowAuth(true)} />
        <main style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '1rem' }}>
            No artist found at @{username}.
          </p>
          <Link href="/" className="btn btn-sm">← Back home</Link>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  const isOwnProfile = user && myProfile?.id === profile.id
  const totalLikes = songs.reduce((acc, s) => {
    return acc + (s.versions?.reduce((a, v) => a + (v.version_likes?.[0]?.count || 0), 0) || 0)
  }, 0)
  const totalContributionLikes = contributions.reduce((acc, v) => acc + v.likeCount, 0)

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        onSignIn={() => setShowAuth(true)}
        onUpload={() => user ? setShowUpload(true) : setShowAuth(true)}
      />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>

        {/* Profile Header */}
        <div style={{ borderLeft: '4px solid var(--burnt-orange)', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                @{profile.username}
              </h1>
              <p className="mono" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                {songs.length} song{songs.length !== 1 ? 's' : ''} · {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} · {totalLikes + totalContributionLikes} total likes
              </p>
            </div>
            {isOwnProfile && (
              <Link href="/profile/edit" className="btn btn-sm">Edit Profile</Link>
            )}
          </div>
          {profile.bio && (
            <p style={{ marginTop: '1rem', opacity: 0.85, lineHeight: 1.6 }}>{profile.bio}</p>
          )}
        </div>

        {/* Songs Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            Songs
          </h2>
          {songs.length === 0 ? (
            <p className="mono" style={{ opacity: 0.5, fontSize: '0.9rem' }}>
              @{profile.username} hasn't released anything yet.
            </p>
          ) : songs.map(song => {
            const songLikes = song.versions?.reduce((a, v) => a + (v.version_likes?.[0]?.count || 0), 0) || 0
            return (
              <div key={song.id} style={{ background: 'var(--warm-grey)', borderLeft: '4px solid var(--burnt-orange)', padding: '1rem 1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/song/${song.id}`} style={{ textDecoration: 'none' }}>
                    <p className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '0.2rem', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.title}
                    </p>
                  </Link>
                  <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {song.versions?.length || 0} version{song.versions?.length !== 1 ? 's' : ''} · ♡ {songLikes} · {disclosureLabel(song.ai_disclosure)}
                  </p>
                </div>
                <Link href={`/song/${song.id}`} className="btn btn-sm" style={{ flexShrink: 0 }}>Studio →</Link>
              </div>
            )
          })}
        </section>

        {/* Contributions Section */}
        <section>
          <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            Contributions
          </h2>
          {contributions.length === 0 ? (
            <p className="mono" style={{ opacity: 0.5, fontSize: '0.9rem' }}>
              @{profile.username} hasn't contributed to anyone else's songs yet.
            </p>
          ) : contributions.map(v => (
            <div key={v.id} style={{ background: 'var(--warm-grey)', borderLeft: '4px solid var(--muted-red)', padding: '1rem 1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link href={`/song/${v.song_id}`} style={{ textDecoration: 'none' }}>
                  <p className="mono" style={{ color: 'var(--muted-red)', marginBottom: '0.2rem', cursor: 'pointer' }}>
                    [{versionLabel(v).toUpperCase()}] {v.songs?.title}
                  </p>
                </Link>
                <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  ♡ {v.likeCount} · original by @{v.originalAuthor || 'unknown'} · {disclosureLabel(v.ai_disclosure)}
                </p>
                {v.contribution_notes && (
                  <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{v.contribution_notes}"
                  </p>
                )}
              </div>
              <Link href={`/song/${v.song_id}`} className="btn btn-sm" style={{ flexShrink: 0 }}>Studio →</Link>
            </div>
          ))}
        </section>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadProfile() }} />}
    </div>
  )
}
