import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { toggleStudentActive } from './students/actions'


interface Student {
  id: string
  student_number: string
  first_name: string
  last_name: string
  email: string
  faculty: string | null
  is_active: boolean
  orientation_points: number
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    faculty?: string
  }>
}) {
  const params = await searchParams

  const search = params.search ?? ''
  const faculty = params.faculty ?? ''

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
    data: students,
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
      orientation_points
    `)
    .order('student_number')

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-600">
        {error.message}
      </div>
    )
  }

  const allStudents =
    (students ?? []) as Student[]

  const facultyList = Array.from(
    new Set(
      allStudents
        .map(
          (student) =>
            student.faculty
        )
        .filter(
          (
            faculty
          ): faculty is string =>
            faculty !== null &&
            faculty.trim() !== ''
        )
    )
  ).sort()

  let filteredStudents = [
    ...allStudents,
  ]

  if (search !== '') {
    filteredStudents =
      filteredStudents.filter(
        (student) =>
          student.student_number.includes(
            search
          ) ||
          `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      )
  }

  if (faculty !== '') {
    filteredStudents =
      filteredStudents.filter(
        (student) =>
          student.faculty === faculty
      )
  }

  const totalStudents =
    allStudents.length

  const activeStudents =
    allStudents.filter(
      (student) =>
        student.is_active
    ).length

  const inactiveStudents =
    allStudents.filter(
      (student) =>
        !student.is_active
    ).length

  const totalFaculties =
    facultyList.length

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Student Management
        </h1>

        <p className="mt-2 text-gray-500">
          View, edit and manage registered students.
        </p>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Students
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalStudents}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Active Students
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeStudents}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Inactive Students
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {inactiveStudents}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Faculties
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalFaculties}
          </h2>
        </div>

      </div>

      {/* SEARCH */}

      <form
        action="/admin/students"
        method="GET"
        className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5 shadow-sm"
      >

        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search name or student number..."
          className="w-80 rounded-lg border px-4 py-2 focus:border-blue-600 focus:outline-none"
        />

        <select
          name="faculty"
          defaultValue={faculty}
          className="rounded-lg border px-4 py-2"
        >
          <option value="">
            All Faculties
          </option>

          {facultyList.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>

        <Link
          href="/admin/students"
                    className="rounded-lg border px-6 py-2 hover:bg-gray-100"
        >
          Reset
        </Link>

      </form>

      <p className="text-sm text-gray-500">
        Showing{' '}
        {filteredStudents.length}{' '}
        of {totalStudents} students
      </p>

      {/* STUDENTS TABLE */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-6 py-4 text-left font-semibold">
                  Student Number
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Name
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Faculty
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Email
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Points
                </th>

                <th className="px-6 py-4 text-center font-semibold">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredStudents.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-10 text-center text-gray-500"
                  >
                    No students found.
                  </td>

                </tr>

              ) : (

                filteredStudents.map(
                  (student) => (

                    <tr
                      key={student.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">
                        {
                          student.student_number
                        }
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {
                          student.first_name
                        }{' '}
                        {
                          student.last_name
                        }
                      </td>

                      <td className="px-6 py-4">
                        {
                          student.faculty ||
                          'Not set'
                        }
                      </td>

                      <td className="px-6 py-4">
                        {student.email}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            student.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {student.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {
                          student.orientation_points
                        }
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex flex-wrap justify-center gap-2">

                          {/* VIEW */}

                          <Link
                            href={`/admin/students/${student.id}`}
                            className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            View
                          </Link>

                          {/* EDIT */}

                          <Link
                            href={`/admin/students/${student.id}?edit=true`}
                            className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                          >
                            Edit
                          </Link>

                          {/* ENABLE / DISABLE */}

                          <form
                            action={
                              toggleStudentActive
                            }
                          >

                            <input
                              type="hidden"
                              name="id"
                              value={
                                student.id
                              }
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
                              className={`rounded-md px-3 py-2 text-sm font-medium text-white ${
                                student.is_active
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {student.is_active
                                ? 'Disable'
                                : 'Enable'}
                            </button>

                          </form>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}