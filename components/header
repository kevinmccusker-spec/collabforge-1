import { useAuth } from '../pages/_app'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Header({ onSignIn, onUpload }) {
  const { user, profile } = useAuth()

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <header style={{
      padding: '1.5rem 2rem',
      borderBottom: '2px solid var(--burnt-orange)',
      background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 className="mono" style={{
              fontSize: '2rem',
              letterSpacing: '-2px',
              color: 'var(--burnt-orange)',
              textTransform: 'uppercase',
            }}>
              CollabForge
              <span style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem', marginLeft: 8, animation: 'pulse 2s infinite' }}>â–¶</span>
            </h1>
          </Link>
          <p className="mono" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 2 }}>
            Let the world finish what you started
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-yellow)' }}>
                @{profile?.username}
              </span>
              <Link href="/dashboard" className="btn btn-sm">Dashboard</Link>
              <button className="btn btn-sm" onClick={onUpload}>+ Upload</button>
              <button className="btn btn-sm" onClick={signOut}>Sign Out</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onSignIn}>Sign In</button>
          )}
        </div>
      </div>
    </header>
  )
}
