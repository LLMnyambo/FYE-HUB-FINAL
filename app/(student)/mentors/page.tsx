import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { BookOpen, Star, MessageCircle } from 'lucide-react'

export default async function MentorsPage() {
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

  const { data: mentors, error } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      profile_id,
      year_of_study,
      bio,
      is_visible,
      is_approved,
      availability_status,
      profiles (
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        faculty
      ),
      mentor_modules (
        module_name
      )
    `)
    .eq('is_visible', true)
    .eq('is_approved', true)

  const mentorIds = (mentors || []).map((mentor: any) => mentor.id)
  const profileIds = (mentors || []).map((mentor: any) => mentor.profile_id)

  let reviews: any[] = []
  let conversations: any[] = []

  if (mentorIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('mentor_profile_id, rating')
      .in('mentor_profile_id', mentorIds)

    reviews = reviewRows || []
  }

  if (profileIds.length > 0) {
    const { data: conversationRows } = await supabase
      .from('conversations')
      .select('tutor_id, status')
      .in('tutor_id', profileIds)
      .eq('status', 'closed')

    conversations = conversationRows || []
  }

  function getLiveRating(mentorId: string) {
    const mentorReviews = reviews.filter(
      (review) => review.mentor_profile_id === mentorId
    )

    if (mentorReviews.length === 0) {
      return { average: 0, count: 0 }
    }

    const total = mentorReviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    )

    return {
      average: total / mentorReviews.length,
      count: mentorReviews.length,
    }
  }

  function getClosedSessions(profileId: string) {
    return conversations.filter(
      (conversation) => conversation.tutor_id === profileId
    ).length
  }

  function statusLabel(status: string) {
    if (status === 'active') return 'Active'
    if (status === 'busy') return 'Busy'
    return 'Not Available'
  }

  function statusClasses(status: string) {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'busy') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-[#F9A825]" />
          <h1 className="text-3xl font-bold text-[#1A2A6C]">
            Find a Mentor
          </h1>
        </div>

        <p className="text-[#757575]">
          Connect with peer mentors for academic support
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          Unable to load mentors: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mentors && mentors.length > 0 ? (
          mentors.map((mentor: any) => {
            const firstName = mentor.profiles?.first_name || ''
            const lastName = mentor.profiles?.last_name || ''
            const fullName = `${firstName} ${lastName}`.trim() || 'Mentor'
            const initials =
              `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'M'

            const modules =
              mentor.mentor_modules?.map(
                (module: any) => module.module_name
              ) || []

            const rating = getLiveRating(mentor.id)
            const sessions = getClosedSessions(mentor.profile_id)
            const status = mentor.availability_status || 'not_available'
            const canMessage = status !== 'not_available'

            return (
              <div
                key={mentor.id}
                className="group rounded-xl border border-[#F9A825]/10 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  {mentor.profiles?.avatar_url ? (
                    <img
                      src={mentor.profiles.avatar_url}
                      alt={fullName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1A2A6C]/5 text-xl font-bold text-[#1A2A6C] transition group-hover:bg-[#1A2A6C] group-hover:text-white">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-[#1A2A6C]">
                        {fullName}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#757575]">
                      {mentor.year_of_study || 'Year not set'}
                    </p>

                    {mentor.profiles?.faculty && (
                      <p className="text-xs text-[#757575]">
                        {mentor.profiles.faculty}
                      </p>
                    )}
                  </div>
                </div>

                {modules.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {modules.slice(0, 3).map((module: string) => (
                      <span
                        key={module}
                        className="rounded-full bg-[#F9A825]/10 px-2 py-0.5 text-xs font-medium text-[#F9A825]"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-4 line-clamp-2 text-sm text-[#757575]">
                  {mentor.bio || 'This mentor has not added a bio yet.'}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(rating.average)
                            ? 'fill-[#F9A825] text-[#F9A825]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-sm font-medium text-[#212121]">
                    {rating.average.toFixed(1)}
                  </span>

                  <span className="text-xs text-[#757575]">
                    ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
                  </span>

                  <span className="text-xs text-[#757575]">
                    • {sessions} {sessions === 1 ? 'session' : 'sessions'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="rounded-md border border-[#1A2A6C] px-3 py-2 text-center text-sm font-medium text-[#1A2A6C] transition hover:bg-[#1A2A6C] hover:text-white"
                  >
                    View Profile
                  </Link>

                  {canMessage ? (
                    <Link
                      href={`/chat?mentor=${mentor.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-md bg-[#1A2A6C] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2A3A7C]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {status === 'busy' ? 'Message Anyway' : 'Message'}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9]">
              <BookOpen className="h-8 w-8 text-[#1A2A6C]" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#1A2A6C]">
              No mentors available yet
            </h3>

            <p className="text-[#757575]">
              Check back soon for mentor listings
            </p>
          </div>
        )}
      </div>
    </div>
  )
}