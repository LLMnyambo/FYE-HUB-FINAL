'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function validatePassword(password: string) {
  const hasMinLength =
    password.length >= 10

  const hasUppercase =
    /[A-Z]/.test(password)

  const hasNumber =
    /[0-9]/.test(password)

  const hasSpecialCharacter =
    /[^A-Za-z0-9]/.test(password)

  return {
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecialCharacter,
    isValid:
      hasMinLength &&
      hasUppercase &&
      hasNumber &&
      hasSpecialCharacter,
  }
}

export async function register(
  prevState: any,
  formData: FormData
) {
  const firstName =
    formData.get('firstName')?.toString().trim()

  const lastName =
    formData.get('lastName')?.toString().trim()

  const studentNumber =
    formData.get('studentNumber')?.toString().trim()

  const email =
    formData.get('email')?.toString().trim()

  const faculty =
    formData.get('faculty')?.toString().trim()

  const password =
    formData.get('password')?.toString() || ''

  const confirmPassword =
    formData.get('confirmPassword')?.toString() || ''

  if (
    !firstName ||
    !lastName ||
    !studentNumber ||
    !email ||
    !faculty
  ) {
    return {
      error:
        'Please complete all required registration fields.',
    }
  }

  if (password !== confirmPassword) {
    return {
      error:
        'The passwords do not match.',
    }
  }

  const passwordValidation =
    validatePassword(password)

  if (!passwordValidation.isValid) {
    return {
      error:
        'Password must be at least 10 characters and include an uppercase letter, a number and a special character.',
    }
  }

  const umpEmail =
    `${studentNumber}@ump.ac.za`

  const cookieStore =
    await cookies()

  const supabase =
    createServerClient(
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
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        student_number: studentNumber,
        first_name: firstName,
        last_name: lastName,
        faculty,
        ump_email: umpEmail,
      },

      emailRedirectTo:
        `${process.env.NEXT_PUBLIC_APP_URL}/verify`,
    },
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  redirect('/verify')
}