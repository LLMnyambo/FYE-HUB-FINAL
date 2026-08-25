'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    const supabase = createClient()

    const redirectTo =
  `${window.location.origin}/update-password`

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Password reset link sent. Please check your email.'
    )

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-lg">

        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Login
        </Link>

        <div className="mt-6">

          <h1 className="text-3xl font-bold text-slate-900">
            Forgot Password?
          </h1>

          <p className="mt-2 text-slate-500">
            Enter the email address linked to your FYE Hub account.
          </p>

        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              placeholder="student@ump.ac.za"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Sending...'
              : 'Send Reset Link'}
          </button>

        </form>

      </div>

    </main>
  )
}