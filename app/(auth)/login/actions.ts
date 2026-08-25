'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const selectedRole = formData.get('role') as string
  const password = formData.get('password') as string

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
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  let email = ''

  // Student and Mentor both use student number
  if (
    selectedRole === 'student' ||
    selectedRole === 'mentor'
  ) {
    const studentNumber =
      (formData.get('studentNumber') as string)?.trim()

    if (!studentNumber) {
      return {
        error: 'Please enter your student number.',
      }
    }

    const {
      data: emailData,
      error: emailError,
    } = await supabase.rpc(
      'get_email_by_student_number',
      {
        p_student_number: studentNumber,
      }
    )

    if (emailError || !emailData) {
      return {
        error: 'Invalid student number or password.',
      }
    }

    email = emailData
  }

  // Admin uses email
  else if (selectedRole === 'admin') {
    const adminEmail =
      (formData.get('email') as string)?.trim()

    if (!adminEmail) {
      return {
        error: 'Please enter your admin email.',
      }
    }

    email = adminEmail
  } else {
    return {
      error: 'Please select a valid login type.',
    }
  }

  // Sign in
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return {
      error:
        authError?.message ||
        'Invalid login details.',
    }
  }

  // Load profile
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      student_number,
      first_name,
      last_name,
      email,
      role
    `)
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()

    return {
      error: 'Unable to load your profile.',
    }
  }

  // Admin login
  if (selectedRole === 'admin') {
    if (profile.role !== 'admin') {
      await supabase.auth.signOut()

      return {
        error:
          'This account does not have administrator access.',
      }
    }

    redirect('/admin')
  }

  // Mentor login
  if (selectedRole === 'mentor') {
    const {
      data: isApprovedMentor,
      error: mentorCheckError,
    } = await supabase.rpc(
      'is_approved_mentor',
      {
        p_profile_id: authData.user.id,
      }
    )

    if (mentorCheckError) {
      console.error(
        'Mentor approval check error:',
        mentorCheckError
      )

      await supabase.auth.signOut()

      return {
        error:
          'Unable to verify your mentor account.',
      }
    }

    if (!isApprovedMentor) {
      await supabase.auth.signOut()

      return {
        error:
          'This student has not been approved as a mentor.',
      }
    }

    redirect('/tutor/dashboard')
  }

  // Student login
  if (selectedRole === 'student') {
    if (profile.role === 'admin') {
      await supabase.auth.signOut()

      return {
        error:
          'Administrator accounts must use the Admin login.',
      }
    }

    redirect('/home')
  }

  redirect('/home')
}