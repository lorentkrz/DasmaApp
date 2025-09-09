"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Initial session error:', error.message)
          setAuthState({ user: null, loading: false, error: error.message })
          return
        }

        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null
        })
      } catch (error: any) {
        console.error('Session fetch failed:', error?.message)
        setAuthState({
          user: null,
          loading: false,
          error: error?.message || 'Session fetch failed'
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session)

      setAuthState({
        user: session?.user ?? null,
        loading: false,
        error: null
      })

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in')
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          router.push('/auth/login')
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed')
          break
        case 'USER_UPDATED':
          console.log('User updated')
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error.message)
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return
      }

      // Clear any cached data
      router.push('/auth/login')
    } catch (error: any) {
      console.error('Sign out failed:', error?.message)
      setAuthState(prev => ({ ...prev, loading: false, error: error?.message }))
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Session refresh error:', error.message)
        setAuthState(prev => ({ ...prev, error: error.message }))
        return false
      }

      setAuthState({
        user: data.session?.user ?? null,
        loading: false,
        error: null
      })

      return true
    } catch (error: any) {
      console.error('Session refresh failed:', error?.message)
      setAuthState(prev => ({ ...prev, error: error?.message }))
      return false
    }
  }

  return {
    ...authState,
    signOut,
    refreshSession
  }
}

export default useAuth
