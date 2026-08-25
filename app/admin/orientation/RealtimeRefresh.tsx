'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeRefresh({
  studentId,
}: {
  studentId: string
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(
        `orientation-realtime-${studentId}`
      )

      // Admin changes orientation tasks
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orientation_tasks',
        },
        () => {
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
        () => {
          router.refresh()
        }
      )

      // Student profile points/details change
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${studentId}`,
        },
        () => {
          router.refresh()
        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, studentId])

  return null
}