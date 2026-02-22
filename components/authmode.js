import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: data.user.id, username, email })
          if (profileError) throw profileError
        }

        setSuccess('Account created! Check your email to verify, then sign in.')
        setTimeout(() => { setMode('signin'); setSuccess('') }, 3000)

      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--cream)', fontSize: '1.5rem', cursor: 'pointer' }}
        >Ã—</button>

        <h2 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          {mode === 'signup' ? 'Join CollabForge' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_artist_name"
                required
              />
            </div>
          )}

          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mono" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required
              minLength={6}
            />
          </div>

          {error && <p className="error">âš  {error}</p>}
          {success && <p className="success">âœ“ {success}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.95rem' }}>
            {mode === 'signup' ? 'Already have an account? ' : 'Need an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-yellow)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
