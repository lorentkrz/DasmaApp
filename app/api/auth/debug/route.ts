import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get session information
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get cookies for debugging
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase')
    )
    
    // Try to fetch profile if user exists
    let profile = null
    let profileError = null
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      profile = data
      profileError = error
    }
    
    // Check environment
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment,
      auth: {
        hasSession: !!session,
        hasUser: !!user,
        sessionError: sessionError?.message || null,
        userError: userError?.message || null,
        userId: user?.id || null,
        userEmail: user?.email || null,
      },
      profile: {
        exists: !!profile,
        error: profileError?.message || null,
        data: profile,
      },
      cookies: {
        total: cookies.length,
        authCookies: authCookies.map(c => ({
          name: c.name,
          valueLength: c.value.length,
          hasValue: c.value.length > 0,
        })),
      },
      diagnostics: {
        recommendation: getRecommendation({ session, user, sessionError, userError, profile, profileError })
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

function getRecommendation({ session, user, sessionError, userError, profile, profileError }: any): string {
  if (!session && !user) {
    if (sessionError?.includes('expired') || userError?.includes('expired')) {
      return 'Session expired. User needs to log in again.'
    }
    return 'No active session. User is not authenticated.'
  }
  
  if (session && !user) {
    return 'Session exists but user fetch failed. Possible cookie sync issue.'
  }
  
  if (user && !profile) {
    if (profileError?.includes('PGRST116')) {
      return 'User authenticated but profile missing. Run SQL migration scripts.'
    }
    return `Profile fetch error: ${profileError?.message || 'Unknown'}`
  }
  
  if (user && profile) {
    return 'Authentication working correctly.'
  }
  
  return 'Unknown state - check logs for details.'
}
