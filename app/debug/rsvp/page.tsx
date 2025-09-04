'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RSVPDebugPage() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('attending')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const debugRSVPFlow = async () => {
    setLoading(true)
    setResults(null)

    try {
      // Step 1: Check if token exists and get invitation data
      const { data: invitationData, error: invError } = await supabase
        .from('invitations')
        .select(`
          id,
          wedding_id,
          guest_id,
          token,
          created_at,
          responded_at,
          guests (
            id,
            first_name,
            last_name,
            rsvp_status,
            rsvp_responded_at,
            updated_at
          )
        `)
        .eq('token', token)
        .single()

      console.log('Invitation data:', invitationData, 'Error:', invError)

      // Step 2: Try the existing RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_invitation_and_guest', {
        p_token: token
      })

      console.log('RPC result:', rpcResult, 'Error:', rpcError)

      // Step 3: Try updating via the debug RPC (if it exists)
      let debugUpdateResult = null
      let debugUpdateError = null
      
      try {
        const { data: debugResult, error: debugError } = await supabase.rpc('set_rsvp_by_token_debug', {
          p_token: token,
          p_status: status
        })
        debugUpdateResult = debugResult
        debugUpdateError = debugError
      } catch (e) {
        debugUpdateError = e
      }

      // Step 4: Try direct update
      let directUpdateResult = null
      let directUpdateError = null

      if (invitationData?.guests?.id) {
        const { data: updateResult, error: updateError } = await supabase
          .from('guests')
          .update({
            rsvp_status: status,
            rsvp_responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', invitationData.guests.id)
          .select()

        directUpdateResult = updateResult
        directUpdateError = updateError
      }

      // Step 5: Check final status
      const { data: finalCheck, error: finalError } = await supabase
        .from('guests')
        .select('id, first_name, last_name, rsvp_status, rsvp_responded_at, updated_at')
        .eq('id', invitationData?.guests?.id)
        .single()

      setResults({
        step1_invitation_lookup: {
          data: invitationData,
          error: invError
        },
        step2_rpc_function: {
          data: rpcResult,
          error: rpcError
        },
        step3_debug_rpc_update: {
          data: debugUpdateResult,
          error: debugUpdateError
        },
        step4_direct_update: {
          data: directUpdateResult,
          error: directUpdateError
        },
        step5_final_check: {
          data: finalCheck,
          error: finalError
        },
        summary: {
          token_exists: !!invitationData,
          guest_found: !!invitationData?.guests,
          initial_status: invitationData?.guests?.rsvp_status,
          requested_status: status,
          final_status: finalCheck?.rsvp_status,
          status_changed: invitationData?.guests?.rsvp_status !== finalCheck?.rsvp_status,
          update_successful: finalCheck?.rsvp_status === status
        }
      })

    } catch (error) {
      console.error('Debug error:', error)
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>RSVP Status Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Invitation Token</label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter invitation token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">RSVP Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="attending">Attending</option>
                <option value="not_attending">Not Attending</option>
                <option value="maybe">Maybe</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={debugRSVPFlow} 
            disabled={!token || loading}
            className="w-full"
          >
            {loading ? 'Debugging...' : 'Debug RSVP Flow'}
          </Button>

          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Debug Results</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
              
              {results.summary && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Token Exists: <span className={results.summary.token_exists ? 'text-green-600' : 'text-red-600'}>{results.summary.token_exists ? 'Yes' : 'No'}</span></div>
                      <div>Guest Found: <span className={results.summary.guest_found ? 'text-green-600' : 'text-red-600'}>{results.summary.guest_found ? 'Yes' : 'No'}</span></div>
                      <div>Initial Status: <span className="font-mono">{results.summary.initial_status}</span></div>
                      <div>Requested Status: <span className="font-mono">{results.summary.requested_status}</span></div>
                      <div>Final Status: <span className="font-mono">{results.summary.final_status}</span></div>
                      <div>Update Successful: <span className={results.summary.update_successful ? 'text-green-600' : 'text-red-600'}>{results.summary.update_successful ? 'Yes' : 'No'}</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
