import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  toggleStudentActive,
  updateStudentProfile,
} from '../actions'

export default async function StudentProfile({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    edit?: string
    updated?: string
    error?: string
  }>
}) {
  const { id } = await params
  const query = await searchParams

  const isEditing =
    query.edit === 'true'

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
    data: student,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      student_number,
      first_name,
      last_name,
      email,
      faculty,
      is_active,
      orientation_points,
      orientation_badge
    `)
    .eq('id', id)
    .single()

  if (
    error ||
    !student
  ) {
    notFound()
  }

  return (
    <div className="space-y-8">

      {/* TOP BAR */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <Link
          href="/admin/students"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Students
        </Link>

        {!isEditing && (
          <Link
            href={`/admin/students/${id}?edit=true`}
            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Edit Student
          </Link>
        )}

      </div>

      {/* SUCCESS MESSAGE */}

      {query.updated === 'true' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          Student information updated successfully.
        </div>
      )}

      {/* ERROR MESSAGE */}

      {query.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {query.error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-8 shadow-sm">

        {isEditing ? (

          <>
            {/* EDIT MODE */}

            <div className="mb-8">

              <h1 className="text-3xl font-bold text-gray-900">
                Edit Student
              </h1>

              <p className="mt-2 text-gray-500">
                Update crucial student information.
              </p>

            </div>

            <form
              action={updateStudentProfile}
              className="space-y-8"
            >

              <input
                type="hidden"
                name="id"
                value={student.id}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* FIRST NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    defaultValue={
                      student.first_name || ''
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* LAST NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    defaultValue={
                      student.last_name || ''
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* STUDENT NUMBER */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Student Number
                  </label>

                  <input
                    type="text"
                    name="studentNumber"
                    defaultValue={
                      student.student_number || ''
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Student numbers must be unique.
                  </p>

                </div>

                {/* FACULTY */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Faculty
                  </label>

                  <input
                    type="text"
                    name="faculty"
                    defaultValue={
                      student.faculty || ''
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* READ-ONLY EMAIL */}

              <div className="rounded-xl border bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-700">
                  Email
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {student.email}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Email is linked to the authentication account and cannot be edited here.
                </p>

              </div>

              {/* READ-ONLY ORIENTATION DATA */}

              <div className="grid grid-cols-1 gap-6 rounded-xl border bg-gray-50 p-5 md:grid-cols-2">

                <div>

                  <p className="text-sm text-gray-500">
                    Orientation Points
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {student.orientation_points}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Badge
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {student.orientation_badge ?? 'None'}
                  </p>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Save Changes
                </button>

                <Link
                  href={`/admin/students/${id}`}
                  className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>

              </div>

            </form>

          </>

        ) : (

          <>
            {/* VIEW MODE */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h1 className="text-3xl font-bold text-gray-900">
                  {student.first_name}{' '}
                  {student.last_name}
                </h1>

                <p className="mt-1 text-gray-500">
                  Student Profile
                </p>

              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                  student.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {student.is_active
                  ? 'Active'
                  : 'Inactive'}
              </span>

            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Student Number
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {student.student_number}
                </p>

              </div>

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Email
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {student.email}
                </p>

              </div>

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Faculty
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {student.faculty || 'Not set'}
                </p>

              </div>

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Orientation Points
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {student.orientation_points}
                </p>

              </div>

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Badge
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {student.orientation_badge ?? 'None'}
                </p>

              </div>

              <div className="rounded-lg border p-5">

                <p className="text-sm text-gray-500">
                  Account Status
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    student.is_active
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {student.is_active
                    ? 'Active'
                    : 'Inactive'}
                </p>

              </div>

            </div>

            {/* ACCOUNT CONTROL */}

            <div className="mt-8 border-t pt-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Account Access
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Disable or restore access without deleting the student's data.
              </p>

              <form
                action={toggleStudentActive}
                className="mt-4"
              >

                <input
                  type="hidden"
                  name="id"
                  value={student.id}
                />

                <input
                  type="hidden"
                  name="newStatus"
                  value={
                    student.is_active
                      ? 'false'
                      : 'true'
                  }
                />

                <button
                  type="submit"
                  className={`rounded-lg px-5 py-3 font-semibold text-white transition ${
                    student.is_active
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {student.is_active
                    ? 'Disable Student Account'
                    : 'Enable Student Account'}
                </button>

              </form>

              <p className="mt-3 text-xs text-gray-400">
                Disabling an account keeps the student's profile, orientation progress, chats, and other records.
              </p>

            </div>

          </>

        )}

      </div>

    </div>
  )
}