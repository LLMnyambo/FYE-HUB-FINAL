import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string
    error?: string
    ticket?: string
  }>
}) {
  const params = await searchParams

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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return <div>Please log in.</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">

      <h1 className="text-4xl font-bold text-slate-900">
        Need Assistance?
      </h1>

      <p className="mt-3 text-slate-500">
        Submit a support ticket and an administrator will assist you.
      </p>

      {/* Success Message */}

      {params.success && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-green-700">
            Support ticket submitted successfully.
          </h2>

          <p className="mt-2 text-green-700">
            Ticket Number: <strong>{params.ticket}</strong>
          </p>

          <p className="mt-1 text-green-600">
            Your request has been received and is awaiting review by an administrator.
          </p>
        </div>
      )}

      {/* Error Message */}

      {params.error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          There was a problem submitting your ticket. Please try again.
        </div>
      )}

      <form
        action="/support/create"
        method="post"
        className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >

        <div>

          <label className="mb-2 block font-medium text-slate-700">
            Subject
          </label>

          <input
            name="subject"
            type="text"
            required
            placeholder="Enter a subject"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
          />

        </div>

        <div>

          <label className="mb-2 block font-medium text-slate-700">
            Category
          </label>

          <select
            name="category"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
          >
            <option value="">Select a category</option>
            <option value="Orientation">Orientation</option>
            <option value="Technical">Technical Issue</option>
            <option value="Registration">Registration</option>
            <option value="Certificate">Certificate</option>
            <option value="Other">Other</option>
          </select>

        </div>

        <div>

          <label className="mb-2 block font-medium text-slate-700">
            Message
          </label>

          <textarea
            name="message"
            required
            rows={6}
            placeholder="Describe your problem..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
          />

        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Submit Support Ticket
        </button>

      </form>

    </div>
  )
}