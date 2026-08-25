import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  promoteToMentor,
  toggleMentorApproval,
  toggleMentorVisibility,
} from './actions'

type Mentor = {
  id: string
  profile_id: string
  year_of_study: string | null
  bio: string | null
  rating_avg: number | null
  session_count: number | null
  is_visible: boolean
  is_approved: boolean
  availability_status:
    | 'active'
    | 'busy'
    | 'not_available'
  created_at: string
}

type Profile = {
  id: string
  student_number: string | null
  first_name: string | null
  last_name: string | null
  email: string
  faculty: string | null
  is_active: boolean
}

export default async function AdminMentorsPage() {
  const cookieStore =
    await cookies()

  const supabase =
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore
              .get(name)
              ?.value
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

  /*
   * LOAD ALL MENTOR PROFILES
   */
  const {
    data: mentorRows,
    error: mentorError,
  } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      profile_id,
      year_of_study,
      bio,
      rating_avg,
      session_count,
      is_visible,
      is_approved,
      availability_status,
      created_at
    `)
    .order('created_at', {
      ascending: false,
    })

  if (mentorError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        {mentorError.message}
      </div>
    )
  }

  const mentors =
    (mentorRows || []) as Mentor[]

  const mentorProfileIds =
    mentors.map(
      (mentor) =>
        mentor.profile_id
    )

  /*
   * LOAD PROFILES BELONGING TO MENTORS
   */
  let mentorProfiles:
    Profile[] = []

  if (
    mentorProfileIds.length >
    0
  ) {
    const {
      data: profiles,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        student_number,
        first_name,
        last_name,
        email,
        faculty,
        is_active
      `)
      .in(
        'id',
        mentorProfileIds
      )

    mentorProfiles =
      (profiles || []) as Profile[]
  }

  /*
   * LOAD STUDENTS WHO ARE NOT YET MENTORS
   */
  const {
    data: studentRows,
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
      role
    `)
    .neq('role', 'admin')
    .order('student_number')

  const availableStudents =
    (studentRows || []).filter(
      (student) =>
        !mentorProfileIds.includes(
          student.id
        )
    )

  /*
   * LIVE CLOSED SESSION COUNTS
   */
  const {
    data: conversations,
  } = await supabase
    .from('conversations')
    .select(`
      id,
      tutor_id,
      status
    `)

  /*
   * LIVE REVIEWS
   */
  const {
    data: reviews,
  } = await supabase
    .from('reviews')
    .select(`
      mentor_profile_id,
      rating
    `)

  function getProfile(
    profileId: string
  ) {
    return mentorProfiles.find(
      (profile) =>
        profile.id === profileId
    )
  }

  function getMentorName(
    profileId: string
  ) {
    const profile =
      getProfile(profileId)

    if (!profile) {
      return 'Unknown Mentor'
    }

    const name =
      `${profile.first_name || ''} ${
        profile.last_name || ''
      }`.trim()

    return (
      name ||
      profile.student_number ||
      profile.email
    )
  }

  function getClosedSessions(
    profileId: string
  ) {
    return (
      conversations?.filter(
        (conversation) =>
          conversation.tutor_id ===
            profileId &&
          conversation.status ===
            'closed'
      ).length || 0
    )
  }

  function getRating(
    mentorId: string
  ) {
    const mentorReviews =
      reviews?.filter(
        (review) =>
          review.mentor_profile_id ===
          mentorId
      ) || []

    if (
      mentorReviews.length === 0
    ) {
      return {
        average: 0,
        count: 0,
      }
    }

    const total =
      mentorReviews.reduce(
        (sum, review) =>
          sum +
          Number(review.rating),
        0
      )

    return {
      average:
        total /
        mentorReviews.length,

      count:
        mentorReviews.length,
    }
  }

  const approvedCount =
    mentors.filter(
      (mentor) =>
        mentor.is_approved
    ).length

  const visibleCount =
    mentors.filter(
      (mentor) =>
        mentor.is_approved &&
        mentor.is_visible
    ).length

  const activeNow =
    mentors.filter(
      (mentor) =>
        mentor.is_approved &&
        mentor.availability_status ===
          'active'
    ).length

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-3xl font-bold text-gray-900">
          Mentor Management
        </h1>

        <p className="mt-2 text-gray-500">
          Manage mentor access and visibility.
        </p>

      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Mentors
          </p>

          <p className="mt-2 text-3xl font-bold">
            {mentors.length}
          </p>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {approvedCount}
          </p>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Visible
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {visibleCount}
          </p>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Now
          </p>

          <p className="mt-2 text-3xl font-bold">
            {activeNow}
          </p>

        </div>

      </div>

      {/* CURRENT MENTORS */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Current Mentors
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Administrative mentor controls.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-5 py-4 text-left">
                  Mentor
                </th>

                <th className="px-5 py-4 text-left">
                  Student Number
                </th>

                <th className="px-5 py-4 text-left">
                  Availability
                </th>

                <th className="px-5 py-4 text-left">
                  Sessions
                </th>

                <th className="px-5 py-4 text-left">
                  Rating
                </th>

                <th className="px-5 py-4 text-left">
                  Visibility
                </th>

                <th className="px-5 py-4 text-left">
                  Mentor Access
                </th>

                <th className="px-5 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {mentors.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="p-10 text-center text-gray-500"
                  >
                    No mentors found.
                  </td>

                </tr>

              ) : (

                mentors.map(
                  (mentor) => {
                    const profile =
                      getProfile(
                        mentor.profile_id
                      )

                    const sessions =
                      getClosedSessions(
                        mentor.profile_id
                      )

                    const rating =
                      getRating(
                        mentor.id
                      )

                    return (
                      <tr
                        key={mentor.id}
                        className="border-t"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {getMentorName(
                              mentor.profile_id
                            )}
                          </p>

                          <p className="text-xs text-gray-400">
                            {profile?.email}
                          </p>

                        </td>

                        <td className="px-5 py-4">
                          {profile?.student_number ||
                            '—'}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">

                            {mentor.availability_status.replace(
                              '_',
                              ' '
                            )}

                          </span>

                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {sessions}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {rating.average.toFixed(
                              2
                            )}
                          </p>

                          <p className="text-xs text-gray-400">
                            {rating.count}{' '}
                            {rating.count === 1
                              ? 'review'
                              : 'reviews'}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              mentor.is_visible
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {mentor.is_visible
                              ? 'Visible'
                              : 'Hidden'}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              mentor.is_approved
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {mentor.is_approved
                              ? 'Enabled'
                              : 'Disabled'}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex flex-wrap justify-center gap-2">

                            {/* SHOW / HIDE */}

                            <form
                              action={
                                toggleMentorVisibility
                              }
                            >

                              <input
                                type="hidden"
                                name="mentorId"
                                value={
                                  mentor.id
                                }
                              />

                              <input
                                type="hidden"
                                name="visible"
                                value={
                                  mentor.is_visible
                                    ? 'false'
                                    : 'true'
                                }
                              />

                              <button
                                type="submit"
                                disabled={
                                  !mentor.is_approved
                                }
                                className="rounded-md bg-slate-600 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {mentor.is_visible
                                  ? 'Hide'
                                  : 'Show'}
                              </button>

                            </form>

                            {/* ENABLE / DISABLE */}

                            <form
                              action={
                                toggleMentorApproval
                              }
                            >

                              <input
                                type="hidden"
                                name="mentorId"
                                value={
                                  mentor.id
                                }
                              />

                              <input
                                type="hidden"
                                name="approved"
                                value={
                                  mentor.is_approved
                                    ? 'false'
                                    : 'true'
                                }
                              />

                              <button
                                type="submit"
                                className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                  mentor.is_approved
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {mentor.is_approved
                                  ? 'Disable Mentor'
                                  : 'Enable Mentor'}
                              </button>

                            </form>

                          </div>

                        </td>

                      </tr>
                    )
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* PROMOTE STUDENTS */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b p-6">

          <h2 className="text-xl font-semibold">
            Promote Students
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Give an active student mentor access.
          </p>

        </div>

        {availableStudents.length === 0 ? (

          <div className="p-8 text-center text-gray-500">
            No students are currently available for promotion.
          </div>

        ) : (

          <div className="divide-y">

            {availableStudents.map(
              (student) => (

                <div
                  key={student.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="font-semibold text-gray-900">

                      {student.first_name}{' '}
                      {student.last_name}

                    </p>

                    <p className="mt-1 text-sm text-gray-500">

                      {student.student_number}{' '}
                      • {student.email}

                    </p>

                    {!student.is_active && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        Student account is disabled.
                      </p>
                    )}

                  </div>

                  <form
                    action={
                      promoteToMentor
                    }
                  >

                    <input
                      type="hidden"
                      name="profileId"
                      value={
                        student.id
                      }
                    />

                    <button
                      type="submit"
                      disabled={
                        !student.is_active
                      }
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Promote to Mentor
                    </button>

                  </form>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  )
}