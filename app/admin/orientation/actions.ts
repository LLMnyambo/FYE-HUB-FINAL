'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAdminSupabase() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/home')
  }

  return supabase
}

/*
 * =========================================
 * CREATE ORIENTATION TASK
 * =========================================
 */
export async function createOrientationTask(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const title =
    formData.get('title')?.toString().trim()

  const description =
    formData.get('description')?.toString().trim()

  const category =
    formData.get('category')?.toString().trim()

  const points =
    Number(formData.get('points'))

  const sortOrder =
    Number(formData.get('sortOrder') || 0)

  if (
    !title ||
    !description ||
    !category
  ) {
    throw new Error(
      'Please complete all required task information.'
    )
  }

  if (
    !Number.isFinite(points) ||
    points < 0
  ) {
    throw new Error(
      'Points must be a valid positive number.'
    )
  }

  const { error } = await supabase
    .from('orientation_tasks')
    .insert({
      title,
      description,
      category,
      points,
      sort_order: sortOrder,
      is_active: true,

      // Required by existing DB constraint,
      // but no longer shown in the admin interface.
      badge_level: 'important',

      // Due dates are no longer used.
      due_date: null,
    })

  if (error) {
    throw new Error(
      `Unable to create orientation task: ${error.message}`
    )
  }

  revalidatePath('/admin/orientation')
  revalidatePath('/orientation')
  revalidatePath('/home')

  redirect(
    '/admin/orientation?created=true'
  )
}

/*
 * =========================================
 * UPDATE ORIENTATION TASK
 * =========================================
 */
export async function updateOrientationTask(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const title =
    formData.get('title')?.toString().trim()

  const description =
    formData.get('description')?.toString().trim()

  const category =
    formData.get('category')?.toString().trim()

  const points =
    Number(formData.get('points'))

  const sortOrder =
    Number(formData.get('sortOrder') || 0)

  if (
    !id ||
    !title ||
    !description ||
    !category
  ) {
    throw new Error(
      'Please complete all required fields.'
    )
  }

  if (
    !Number.isFinite(points) ||
    points < 0
  ) {
    throw new Error(
      'Points must be a valid positive number.'
    )
  }

  const { error } = await supabase
    .from('orientation_tasks')
    .update({
      title,
      description,
      category,
      points,
      sort_order: sortOrder,
    })
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to update task: ${error.message}`
    )
  }

  revalidatePath('/admin/orientation')
  revalidatePath('/orientation')
  revalidatePath('/home')

  redirect(
    '/admin/orientation?updated=true'
  )
}

/*
 * =========================================
 * ENABLE / DISABLE ORIENTATION TASK
 * =========================================
 */
export async function toggleOrientationTask(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const active =
    formData.get('active') === 'true'

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('orientation_tasks')
    .update({
      is_active: active,
    })
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to update task status: ${error.message}`
    )
  }

  revalidatePath('/admin/orientation')
  revalidatePath('/orientation')
  revalidatePath('/home')

  redirect(
    `/admin/orientation?status=${
      active ? 'enabled' : 'disabled'
    }`
  )
}

/*
 * =========================================
 * DELETE ORIENTATION TASK
 * =========================================
 */
export async function deleteOrientationTask(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  if (!id) {
    return
  }

  const { count } = await supabase
    .from('student_task_progress')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('task_id', id)

  if ((count || 0) > 0) {
    throw new Error(
      'This task cannot be deleted because students have already completed it. Disable it instead.'
    )
  }

  const { error } = await supabase
    .from('orientation_tasks')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to delete task: ${error.message}`
    )
  }

  revalidatePath('/admin/orientation')
  revalidatePath('/orientation')
  revalidatePath('/home')

  redirect(
    '/admin/orientation?deleted=true'
  )
}