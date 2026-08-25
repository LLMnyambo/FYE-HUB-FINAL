'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeOrientation({
  studentId,
}: {
  studentId: string
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    console.log('Starting orientation realtime...')

    const channel = supabase
      .channel(`orientation-realtime-${studentId}`)

      // Admin changes orientation tasks
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orientation_tasks',
        },
        (payload) => {
          console.log(
            'ORIENTATION TASK EVENT:',
            payload
          )

          router.refresh()
        }
      )

      // This student's progress changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_task_progress',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log(
            'STUDENT PROGRESS EVENT:',
            payload
          )

          router.refresh()
        }
      )

      // Profile changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${studentId}`,
        },
        (payload) => {
          console.log(
            'PROFILE EVENT:',
            payload
          )

          router.refresh()
        }
      )

      .subscribe((status, error) => {
        console.log(
          'ORIENTATION REALTIME STATUS:',
          status
        )

        if (error) {
          console.error(
            'ORIENTATION REALTIME ERROR:',
            error
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, studentId])

  return null
}