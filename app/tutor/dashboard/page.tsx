import LogoutButton from './logoutbutton'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateMentorProfile } from './actions'

export default async function TutorDashboardPage() {
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

  // =========================================
  // GET LOGGED-IN USER
  // =========================================

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // =========================================
  // GET USER PROFILE
  // =========================================

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
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-red-600">
            Profile not found
          </h1>

          <p className="mt-3 text-gray-600">
            Your login is working, but your profile could not be found.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Logged in account: {user.email}
          </p>
        </div>
      </div>
    )
  }

  // =========================================
  // CHECK MENTOR ACCESS
  //
  // The user can remain role = student.
  // Mentor access is determined by whether
  // mentor_profiles contains their profile ID.
  // =========================================

  const {
  data: mentorProfile,
  error: mentorProfileError,
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
    availability_status
  `)
  .eq('profile_id', user.id)
  .eq('is_approved', true)
  .maybeSingle()

  if (mentorProfileError) {
    console.error(
      'Mentor profile error:',
      mentorProfileError
    )

    redirect('/home')
  }

  if (!mentorProfile) {
    redirect('/home')
  }

  // =========================================
// CALCULATE LIVE RATING FROM REVIEWS
// =========================================

const {
  data: reviews,
  error: reviewsError,
} = await supabase
  .from('reviews')
  .select('rating')
  .eq('mentor_profile_id', mentorProfile.id)

if (reviewsError) {
  console.error(
    'Mentor reviews error:',
    reviewsError
  )
}

const reviewList = reviews || []

const averageRating =
  reviewList.length > 0
    ? reviewList.reduce(
        (total, review) =>
          total + Number(review.rating),
        0
      ) / reviewList.length
    : 0

const reviewCount = reviewList.length
  // =========================================
  // LOAD THIS MENTOR'S CONVERSATIONS
  //
  // conversations.tutor_id points to
  // profiles.id, which is user.id here.
  // =========================================

  const {
    data: conversations,
    error: conversationError,
  } = await supabase
    .from('conversations')
    .select(`
      id,
      student_id,
      tutor_id,
      last_message_at,
      student_unread,
      tutor_unread,
      created_at,
      status
    `)
    .eq('tutor_id', user.id)
    .order('last_message_at', {
      ascending: false,
      nullsFirst: false,
    })

  if (conversationError) {
    console.error(
      'Mentor conversations error:',
      conversationError
    )
  }

  const conversationList = conversations || []
  const closedSessionCount =
  conversationList.filter(
    (conversation) =>
      conversation.status === 'closed'
  ).length

  // Group all conversations by student so repeat sessions
  // stay under one student entry on the dashboard.
  const groupedConversations = conversationList.reduce(
    (groups: Record<string, any[]>, conversation: any) => {
      if (!groups[conversation.student_id]) {
        groups[conversation.student_id] = []
      }

      groups[conversation.student_id].push(conversation)
      return groups
    },
    {}
  )

  const studentConversationGroups = Object.entries(groupedConversations)
    .map(([studentId, studentConversations]) => {
      const sorted = [...(studentConversations as any[])].sort(
        (a, b) => {
          const aDate = new Date(
            a.last_message_at || a.created_at
          ).getTime()

          const bDate = new Date(
            b.last_message_at || b.created_at
          ).getTime()

          return bDate - aDate
        }
      )

      const latestConversation = sorted[0]

      return {
        studentId,
        conversations: sorted,
        latestConversation,
        totalConversations: sorted.length,
        totalUnread: sorted.reduce(
          (total, item) => total + (item.tutor_unread || 0),
          0
        ),
      }
    })
    .sort((a, b) => {
      const aDate = new Date(
        a.latestConversation.last_message_at ||
          a.latestConversation.created_at
      ).getTime()

      const bDate = new Date(
        b.latestConversation.last_message_at ||
          b.latestConversation.created_at
      ).getTime()

      return bDate - aDate
    })

  // =========================================
  // GET STUDENTS IN THOSE CONVERSATIONS
  // =========================================

  const studentIds = [
    ...new Set(
      conversationList.map(
        (conversation) =>
          conversation.student_id
      )
    ),
  ]

  let students: any[] = []

  if (studentIds.length > 0) {
    const {
      data: studentData,
      error: studentError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        student_number,
        first_name,
        last_name,
        email
      `)
      .in('id', studentIds)

    if (studentError) {
      console.error(
        'Student profile error:',
        studentError
      )
    }

    students = studentData || []
  }

  // =========================================
  // HELPERS
  // =========================================

  function getStudent(studentId: string) {
    return students.find(
      (student) => student.id === studentId
    )
  }

  function getStudentName(studentId: string) {
    const student = getStudent(studentId)

    if (!student) {
      return 'Student'
    }

    const fullName =
      `${student.first_name || ''} ${
        student.last_name || ''
      }`.trim()

    return (
      fullName ||
      student.student_number ||
      student.email ||
      'Student'
    )
  }

  const totalUnread =
    conversationList.reduce(
      (total, conversation) =>
        total +
        (conversation.tutor_unread || 0),
      0
    )

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

    {/* Header */}

<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

  <div>
    <h1 className="text-3xl font-bold text-primary">
      Mentor Dashboard
    </h1>

    <p className="mt-1 text-muted-foreground">
      Welcome back,{' '}
      {profile.first_name || profile.email}
    </p>

    {profile.student_number && (
      <p className="mt-1 text-sm text-gray-400">
        Student Number:{' '}
        {profile.student_number}
      </p>
    )}
  </div>

  <LogoutButton />

</div>

        {/* Statistics */}

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">

          {/* Session Count */}

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Session Count
            </p>

           <p className="mt-2 text-3xl font-bold">
  {closedSessionCount}
</p>
          </div>

          {/* Rating */}

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Rating
            </p>
<p className="mt-2 text-3xl font-bold">
  {averageRating.toFixed(2)}
</p>

<p className="mt-1 text-xs text-gray-400">
  {reviewCount}{' '}
  {reviewCount === 1 ? 'review' : 'reviews'}
</p>
          </div>

          {/* Conversations */}

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Conversations
            </p>

            <p className="mt-2 text-3xl font-bold">
              {studentConversationGroups.length}
            </p>
          </div>

          {/* Unread */}

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Unread Messages
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalUnread}
            </p>
          </div>

        </div>

        {/* Mentor Profile Management */}

        <div className="mt-8 rounded-lg bg-white p-6 shadow">

          <div className="mb-6">

            <h2 className="text-xl font-semibold text-gray-900">
              My Mentor Profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update your bio, year of study and availability.
            </p>

          </div>

          <form
            action={updateMentorProfile}
            className="space-y-6"
          >

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>

  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Year of Study
  </label>

  <select
    name="yearOfStudy"
    defaultValue={
      mentorProfile.year_of_study || ''
    }
    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  >
    <option value="">
      Select Year of Study
    </option>

    <option value="2nd Year">
      2nd Year
    </option>

    <option value="3rd Year">
      3rd Year
    </option>

    <option value="Honours">
      Honours
    </option>

  </select>

</div>
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Availability
                </label>

                <select
                  name="availability"
                  defaultValue={
                    mentorProfile.availability_status ||
                    'not_available'
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="busy">
                    Busy
                  </option>

                  <option value="not_available">
                    Not Available
                  </option>

                </select>

              </div>

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Bio
              </label>

              <textarea
                name="bio"
                defaultValue={
                  mentorProfile.bio || ''
                }
                rows={4}
                placeholder="Tell students a little about yourself and how you can help."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Save Mentor Profile
              </button>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mentorProfile.availability_status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : mentorProfile.availability_status === 'busy'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {mentorProfile.availability_status === 'active'
                  ? 'Active'
                  : mentorProfile.availability_status === 'busy'
                  ? 'Busy'
                  : 'Not Available'}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mentorProfile.is_visible
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {mentorProfile.is_visible
                  ? 'Visible to Students'
                  : 'Hidden from Students'}
              </span>

            </div>

          </form>

        </div>

        {/* Student Messages */}

        <div className="mt-8 rounded-lg bg-white shadow">

          <div className="border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Student Messages
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Conversations sent directly to you.
            </p>
          </div>

          {studentConversationGroups.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                No student conversations yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {studentConversationGroups.map((group) => {
                const conversation = group.latestConversation
                const student = getStudent(group.studentId)

                // A repeat active conversation is shown as NEW CHAT
                // instead of creating a second student row.
                const isNewChat =
                  conversation.status === 'active' &&
                  group.totalConversations > 1

                return (
                  <div
                    key={group.studentId}
                    className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {getStudentName(group.studentId)}
                        </h3>

                        {isNewChat && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            NEW CHAT
                          </span>
                        )}

                        {group.totalUnread > 0 && (
                          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                            {group.totalUnread} new
                          </span>
                        )}
                      </div>

                      {student?.student_number && (
                        <p className="mt-1 text-sm text-gray-500">
                          Student Number: {student.student_number}
                        </p>
                      )}

                      {student?.email && (
                        <p className="mt-1 text-sm text-gray-500">
                          {student.email}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-gray-500">
                        {group.totalConversations}{' '}
                        {group.totalConversations === 1
                          ? 'conversation'
                          : 'conversations'}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {conversation.last_message_at
                          ? `Last message: ${new Date(
                              conversation.last_message_at
                            ).toLocaleString('en-ZA')}`
                          : `Conversation started: ${new Date(
                              conversation.created_at
                            ).toLocaleString('en-ZA')}`}
                      </p>
                    </div>

                    <Link
                      href={`/tutor/chat/${conversation.id}`}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {isNewChat ? 'Open New Chat' : 'Open Chat'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}