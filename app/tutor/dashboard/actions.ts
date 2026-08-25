'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getMentorSupabase() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        set(
          name: string,
          value: string,
          options: any
        ) {
          cookieStore.set({
            name,
            value,
            ...options,
          })
        },

        remove(
          name: string,
          options: any
        ) {
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

  const {
    data: mentor,
    error: mentorError,
  } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      profile_id,
      is_approved
    `)
    .eq('profile_id', user.id)
    .eq('is_approved', true)
    .single()

  if (
    mentorError ||
    !mentor
  ) {
    redirect('/home')
  }

  return {
    supabase,
    user,
    mentor,
  }
}

export async function updateMentorProfile(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await getMentorSupabase()

  const bio =
    formData
      .get('bio')
      ?.toString()
      .trim() || null

  const yearOfStudy =
    formData
      .get('yearOfStudy')
      ?.toString()
      .trim() || null

  const availability =
    formData
      .get('availability')
      ?.toString()
      .trim()

  // =========================================
  // VALIDATE YEAR OF STUDY
  // =========================================

  const allowedYears = [
    '2nd Year',
    '3rd Year',
    'Honours',
  ]

  if (
    yearOfStudy &&
    !allowedYears.includes(
      yearOfStudy
    )
  ) {
    throw new Error(
      'Please select a valid year of study.'
    )
  }

  // =========================================
  // VALIDATE AVAILABILITY
  // =========================================

  const allowedStatuses = [
    'active',
    'busy',
    'not_available',
  ]

  if (
    !availability ||
    !allowedStatuses.includes(
      availability
    )
  ) {
    throw new Error(
      'Please select a valid availability status.'
    )
  }

  // =========================================
  // UPDATE MENTOR PROFILE
  // =========================================

  const {
    data: updatedProfile,
    error,
  } = await supabase
    .from('mentor_profiles')
    .update({
      bio,
      year_of_study:
        yearOfStudy,
      availability_status:
        availability,
    })
    .eq(
      'profile_id',
      user.id
    )
    .eq(
      'is_approved',
      true
    )
    .select(`
      id,
      profile_id,
      year_of_study,
      bio,
      availability_status
    `)
    .single()

  if (error) {
    console.error(
      'MENTOR PROFILE UPDATE FAILED:',
      error
    )

    throw new Error(
      `Unable to update mentor profile: ${error.message}`
    )
  }

  console.log(
    'MENTOR PROFILE UPDATED:',
    updatedProfile
  )

  // Clear cached dashboard data
  revalidatePath(
    '/tutor/dashboard'
  )

  // Force a fresh GET so the form displays
  // the newly saved database values.
  redirect(
    '/tutor/dashboard'
  )
}