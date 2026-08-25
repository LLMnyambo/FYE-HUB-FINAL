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
  } = await supabase.auth.getUser()

  if (!user) {
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

export async function updateStudentProfile(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const firstName =
    formData.get('firstName')?.toString().trim()

  const lastName =
    formData.get('lastName')?.toString().trim()

  const studentNumber =
    formData.get('studentNumber')?.toString().trim()

  const faculty =
    formData.get('faculty')?.toString().trim()

  if (
    !id ||
    !firstName ||
    !lastName ||
    !studentNumber
  ) {
    redirect(
      `/admin/students/${id}?edit=true&error=${encodeURIComponent(
        'Please complete all required fields.'
      )}`
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      student_number: studentNumber,
      faculty: faculty || null,
    })
    .eq('id', id)

  if (error) {
    const message =
      error.code === '23505'
        ? 'That student number is already being used.'
        : error.message

    redirect(
      `/admin/students/${id}?edit=true&error=${encodeURIComponent(
        message
      )}`
    )
  }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)

  redirect(
    `/admin/students/${id}?updated=true`
  )
}

export async function toggleStudentActive(
  formData: FormData
) {
  const supabase = await getAdminSupabase()

  const id =
    formData.get('id')?.toString()

  const newStatus =
    formData.get('newStatus') === 'true'

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: newStatus,
    })
    .eq('id', id)

  if (error) {
    console.error(
      'Student status update error:',
      error
    )

    return
  }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)
}