'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function completeTask(formData: FormData) {
  const taskId = formData.get('taskId') as string

  const supabase = await getSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: existing } = await supabase
    .from('student_task_progress')
    .select('id')
    .eq('student_id', session.user.id)
    .eq('task_id', taskId)
    .single()

  if (!existing) {
    await supabase
      .from('student_task_progress')
      .insert({
        student_id: session.user.id,
        task_id: taskId,
      })
  }

  revalidatePath('/orientation')
}

export async function undoTask(formData: FormData) {
  const taskId = formData.get('taskId') as string

  const supabase = await getSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('student_task_progress')
    .delete()
    .eq('student_id', session.user.id)
    .eq('task_id', taskId)

  console.log('Undo error:', error)

  revalidatePath('/orientation')
}