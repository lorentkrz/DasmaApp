import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface DatabaseHealth {
  connectionOk: boolean
  weddingsAccessible: boolean
  profilesAccessible: boolean
  weddingsError?: string
  weddingsCode?: string
  profileError?: string
  profileCode?: string
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      auth: {
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        authError: authError?.message || null,
      },
      database: {
        connectionOk: false,
        weddingsAccessible: false,
        profilesAccessible: false,
      } as DatabaseHealth
    }

    // Test database connectivity if user exists
    if (user) {
      try {
        // Test weddings access
        const { data: weddings, error: weddingsError } = await supabase
          .from('weddings')
          .select('count', { count: 'exact', head: true })
          .eq('owner_id', user.id)

        healthCheck.database.weddingsAccessible = !weddingsError
        healthCheck.database.connectionOk = true

        if (weddingsError) {
          healthCheck.database.weddingsError = weddingsError.message
          healthCheck.database.weddingsCode = weddingsError.code
        }

        // Test profiles access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true })
          .eq('id', user.id)

        healthCheck.database.profilesAccessible = !profileError

        if (profileError && profileError.code !== 'PGRST116') {
          healthCheck.database.profileError = profileError.message
          healthCheck.database.profileCode = profileError.code
        }

      } catch (dbError: any) {
        healthCheck.database.connectionOk = false
        healthCheck.database.error = dbError?.message || 'Database connection failed'
      }
    }

    const statusCode = healthCheck.auth.hasUser ? 200 : 401

    return NextResponse.json(healthCheck, { status: statusCode })

  } catch (error: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error?.message || 'Health check failed'
      },
      { status: 500 }
    )
  }
}
