import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import sounds from '../lib/sounds'

const AuthCtx = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase
      .from('bumblebee_profiles')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile(data)
    if (data) {
      sounds.muteFx = !!data.mute_fx
      sounds.muteVoice = !!data.mute_voice
    }
    setLoading(false)
  }

  async function updateProfile(updates) {
    if (!session) return
    const { data } = await supabase
      .from('bumblebee_profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) setProfile(data)
    return data
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthCtx.Provider value={{
      session, profile, loading, isAdmin,
      signUp, signIn, signOut,
      updateProfile, reloadProfile: () => session && loadProfile(session.user.id),
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
