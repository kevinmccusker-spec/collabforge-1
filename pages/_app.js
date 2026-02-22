import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/globals.css'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, loadProfile }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  )
}
