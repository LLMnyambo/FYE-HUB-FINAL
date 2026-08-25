'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeAnnouncements() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    console.log('Starting announcement realtime...')

    const channel = supabase
      .channel('student-announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          console.log(
            'ANNOUNCEMENT REALTIME EVENT:',
            payload
          )

          router.refresh()
        }
      )
      .subscribe((status, error) => {
        console.log(
          'ANNOUNCEMENT REALTIME STATUS:',
          status
        )

        if (error) {
          console.error(
            'ANNOUNCEMENT REALTIME ERROR:',
            error
          )
        }
      })

    return () => {
      console.log(
        'Closing announcement realtime...'
      )

      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}