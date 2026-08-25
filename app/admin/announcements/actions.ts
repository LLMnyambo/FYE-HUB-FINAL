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

  return {
    supabase,
    user,
  }
}

export async function createAnnouncement(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await getAdminSupabase()

  const title =
    formData.get('title')?.toString().trim()

  const body =
    formData.get('body')?.toString().trim()

  const urgency =
    formData.get('urgency')?.toString()

  if (
    !title ||
    !body ||
    !urgency
  ) {
    throw new Error(
      'Please complete all required announcement fields.'
    )
  }

  if (
    urgency !== 'normal' &&
    urgency !== 'urgent'
  ) {
    throw new Error(
      'Please select a valid urgency level.'
    )
  }

  const { error } = await supabase
    .from('announcements')
    .insert({
      author_id: user.id,
      title,
      body,
      urgency,
      is_published: false,
      published_at: null,
    })

  if (error) {
    throw new Error(
      `Unable to create announcement: ${error.message}`
    )
  }

  revalidatePath('/admin/announcements')

  redirect(
    '/admin/announcements?created=true'
  )
}

export async function updateAnnouncement(
  formData: FormData
) {
  const {
    supabase,
  } = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const title =
    formData.get('title')?.toString().trim()

  const body =
    formData.get('body')?.toString().trim()

  const urgency =
    formData.get('urgency')?.toString()

  if (
    !id ||
    !title ||
    !body ||
    !urgency
  ) {
    throw new Error(
      'Please complete all required announcement fields.'
    )
  }

  if (
    urgency !== 'normal' &&
    urgency !== 'urgent'
  ) {
    throw new Error(
      'Please select a valid urgency level.'
    )
  }

  const { error } = await supabase
    .from('announcements')
    .update({
      title,
      body,
      urgency,
    })
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to update announcement: ${error.message}`
    )
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/home')

  redirect(
    '/admin/announcements?updated=true'
  )
}

export async function toggleAnnouncementPublished(
  formData: FormData
) {
  const {
    supabase,
  } = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const published =
    formData.get('published') === 'true'

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('announcements')
    .update({
      is_published: published,
      published_at: published
        ? new Date().toISOString()
        : null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to update announcement status: ${error.message}`
    )
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/home')

  redirect(
    `/admin/announcements?status=${
      published ? 'published' : 'unpublished'
    }`
  )
}

export async function deleteAnnouncement(
  formData: FormData
) {
  const {
    supabase,
  } = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(
      `Unable to delete announcement: ${error.message}`
    )
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/home')

  redirect(
    '/admin/announcements?deleted=true'
  )
}