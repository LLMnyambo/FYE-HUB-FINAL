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
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (
    profileError ||
    !profile ||
    profile.role !== 'admin'
  ) {
    redirect('/home')
  }

  return supabase
}

/*
 * =========================================
 * PROMOTE STUDENT TO MENTOR
 * =========================================
 */
export async function promoteToMentor(
  formData: FormData
) {
  const supabase =
    await getAdminSupabase()

  const profileId =
    formData
      .get('profileId')
      ?.toString()
      .trim()

  if (!profileId) {
    throw new Error(
      'No student profile was selected.'
    )
  }

  const {
    data: mentorId,
    error,
  } = await supabase.rpc(
    'promote_student_to_mentor',
    {
      p_profile_id: profileId,
    }
  )

  if (error) {
    console.error(
      'MENTOR PROMOTION RPC FAILED:',
      error
    )

    throw new Error(
      `Mentor promotion failed: ${error.message}`
    )
  }

  console.log(
    'MENTOR PROMOTED SUCCESSFULLY:',
    mentorId
  )

  revalidatePath('/admin/mentors')
  revalidatePath('/admin/students')
  revalidatePath('/tutor/dashboard')
}

/*
 * =========================================
 * ENABLE / DISABLE MENTOR ACCESS
 * =========================================
 */
export async function toggleMentorApproval(
  formData: FormData
) {
  const supabase =
    await getAdminSupabase()

  const mentorId =
    formData
      .get('mentorId')
      ?.toString()
      .trim()

  const approved =
    formData.get('approved') ===
    'true'

  if (!mentorId) {
    throw new Error(
      'No mentor was selected.'
    )
  }

  const {
    data: updatedMentor,
    error,
  } = await supabase
    .from('mentor_profiles')
    .update({
      is_approved: approved,

      ...(approved
        ? {}
        : {
            is_visible: false,
            availability_status:
              'not_available',
          }),
    })
    .eq('id', mentorId)
    .select()
    .single()

  if (error) {
    console.error(
      'MENTOR APPROVAL UPDATE FAILED:',
      error
    )

    throw new Error(
      `Unable to update mentor access: ${error.message}`
    )
  }

  console.log(
    'MENTOR ACCESS UPDATED:',
    updatedMentor
  )

  revalidatePath('/admin/mentors')
  revalidatePath('/tutor/dashboard')
}

/*
 * =========================================
 * SHOW / HIDE MENTOR
 * =========================================
 */
export async function toggleMentorVisibility(
  formData: FormData
) {
  const supabase =
    await getAdminSupabase()

  const mentorId =
    formData
      .get('mentorId')
      ?.toString()
      .trim()

  const visible =
    formData.get('visible') ===
    'true'

  if (!mentorId) {
    throw new Error(
      'No mentor was selected.'
    )
  }

  const {
    data: mentor,
    error: mentorError,
  } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      is_approved
    `)
    .eq('id', mentorId)
    .single()

  if (mentorError || !mentor) {
    console.error(
      'MENTOR LOOKUP FAILED:',
      mentorError
    )

    throw new Error(
      'Unable to find the selected mentor.'
    )
  }

  if (!mentor.is_approved) {
    throw new Error(
      'A disabled mentor cannot be made visible.'
    )
  }

  const {
    data: updatedMentor,
    error,
  } = await supabase
    .from('mentor_profiles')
    .update({
      is_visible: visible,
    })
    .eq('id', mentorId)
    .select()
    .single()

  if (error) {
    console.error(
      'MENTOR VISIBILITY UPDATE FAILED:',
      error
    )

    throw new Error(
      `Unable to update mentor visibility: ${error.message}`
    )
  }

  console.log(
    'MENTOR VISIBILITY UPDATED:',
    updatedMentor
  )

  revalidatePath('/admin/mentors')
}