import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../_app'
import Header from '../../components/Header'

export default function ProfileEdit() {
  const router = useRouter()
  const { user, profile, loading: authLoading, loadProfile } = useAuth()
  const [bio, setBio] = useState('')
  const [distName, setDistName] = useState('')
  const [distEmail, setDistEmail] = useState('')
  const [proAffiliation, setProAffiliation] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '')
      setDistName(profile.dist_name || '')
      setDistEmail(profile.dist_email || '')
      setProAffiliation(profile.pro_affiliation || '')
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: bio.trim() || null,
        dist_name: distName.trim() || null,
        dist_email: distEmail.trim() || null,
        pro_affiliation: proAffiliation || null
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await loadProfile(user.id)
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (authLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--accent-yellow)' }}>Loading...</div>
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/')
    return null
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header onSignIn={() => {}} onUpload={() => router.push('/')} />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
        <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 2 }}>Profile</p>
        <h1 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1.8rem', marginBottom: '2rem' }}>Edit Profile</h1>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '2rem' }}>

          {/* Public Profile Section */}
          <section style={{ background: 'var(--warm-grey)', padding: '1.5rem', borderLeft: '3px solid var(--accent-yellow)' }}>
            <h2 className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Public Profile</h2>
            <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1.5rem' }}>
              What everyone sees on CollabForge.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Handle</label>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%' }}
              />
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', fontStyle: 'italic' }}>
                To change your handle, contact support@collabforge.io
              </p>
            </div>

            <div>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about your music, your process, where you're based, anything you want public..."
                rows={4}
                maxLength={500}
                style={{ width: '100%', resize: 'vertical', fontSize: '0.9rem' }}
              />
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', textAlign: 'right' }}>
                {bio.length}/500
              </p>
            </div>
          </section>

          {/* Distribution Info Section */}
          <section style={{ background: 'var(--warm-grey)', padding: '1.5rem', borderLeft: '3px solid var(--burnt-orange)' }}>
            <h2 className="mono" style={{ color: 'var(--burnt-orange)', fontSize: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Distribution Info</h2>
            <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Private. This information is never displayed publicly. It only appears on Distribution Cards when you're part of one — used by distributors and chain participants to set up split sheets and royalty payments.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Distribution Name</label>
              <input
                type="text"
                value={distName}
                onChange={e => setDistName(e.target.value)}
                placeholder="Legal name, band name, or business entity"
                style={{ width: '100%' }}
              />
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', fontStyle: 'italic' }}>
                Optional. The name distributors and co-writers will use for split sheets.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Distribution Email</label>
              <input
                type="email"
                value={distEmail}
                onChange={e => setDistEmail(e.target.value)}
                placeholder="distributor-contact@example.com"
                style={{ width: '100%' }}
              />
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', fontStyle: 'italic' }}>
                Optional now, required when a Distribution Card is generated for a song you're in. Can differ from your account email.
              </p>
            </div>

            <div>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>PRO Affiliation</label>
              <select
                value={proAffiliation}
                onChange={e => setProAffiliation(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select one...</option>
                <option value="ASCAP">ASCAP</option>
                <option value="BMI">BMI</option>
                <option value="SESAC">SESAC</option>
                <option value="GMR">GMR</option>
                <option value="Other">Other</option>
                <option value="Not registered">Not registered</option>
              </select>
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', fontStyle: 'italic' }}>
                Performance Rights Organization. Affects how performance royalties are tracked and paid.
              </p>
            </div>
          </section>

          {error && <p className="error">⚠ {error}</p>}
          {success && (
            <p className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.9rem', textAlign: 'center' }}>
              ✓ Profile saved
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-sm" onClick={() => router.push('/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
