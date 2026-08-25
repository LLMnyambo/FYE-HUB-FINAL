'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mentor = {
  id: string
  profile_id: string
  year_of_study: string | null
  bio: string | null
  rating_avg: number | null
  session_count: number | null
  is_visible: boolean | null
  is_approved: boolean
  availability_status: 'active' | 'busy' | 'not_available'
}

type Profile = {
  first_name: string | null
  last_name: string | null
  faculty: string | null
  avatar_url: string | null
}

type Module = {
  id: string
  module_name: string
}

type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  student_id: string
}

export default function MentorProfilePage() {
  const params = useParams()
  const router = useRouter()

  const mentorId = params.id as string
  const supabase = createClient()

  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [closedSessionCount, setClosedSessionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mentorId) {
      loadMentor()
    }
  }, [mentorId])

  async function loadMentor() {
    try {
      setLoading(true)
      setError('')

      // Get mentor profile
      const { data: mentorData, error: mentorError } =
        await supabase
          .from('mentor_profiles')
          .select('*')
          .eq('id', mentorId)
          .eq('is_visible', true)
          .eq('is_approved', true)
          .single()

      if (mentorError) {
        throw mentorError
      }

      setMentor(mentorData)

      // Get linked user profile
      const { data: profileData, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'first_name, last_name, faculty, avatar_url'
          )
          .eq('id', mentorData.profile_id)
          .single()

      if (profileError) {
        throw profileError
      }

      setProfile(profileData)

      // Get modules
      const { data: moduleData, error: moduleError } =
        await supabase
          .from('mentor_modules')
          .select('id, module_name')
          .eq('mentor_profile_id', mentorId)
          .order('module_name')

      if (moduleError) {
        throw moduleError
      }

      setModules(moduleData || [])

      // Get availability
      const {
        data: availabilityData,
        error: availabilityError,
      } = await supabase
        .from('mentor_availability')
        .select(
          'id, day_of_week, start_time, end_time'
        )
        .eq('mentor_profile_id', mentorId)
        .order('day_of_week')

      if (availabilityError) {
        throw availabilityError
      }

      setAvailability(availabilityData || [])

      // Get reviews
      const { data: reviewData, error: reviewError } =
        await supabase
          .from('reviews')
          .select(
            'id, rating, comment, created_at, student_id'
          )
          .eq('mentor_profile_id', mentorId)
          .order('created_at', { ascending: false })

      if (reviewError) {
        throw reviewError
      }

      const loadedReviews = reviewData || []
      setReviews(loadedReviews)

      const {
        data: closedSessions,
        error: sessionsError,
      } = await supabase
        .from('conversations')
        .select('id')
        .eq('tutor_id', mentorData.profile_id)
        .eq('status', 'closed')

      if (sessionsError) {
        throw sessionsError
      }

      setClosedSessionCount(
        closedSessions?.length || 0
      )
    } catch (err) {
      console.error('Error loading mentor:', err)
      setError('Unable to load this mentor profile.')
    } finally {
      setLoading(false)
    }
  }

  function getFullName() {
    if (!profile) return 'Mentor'

    return `${profile.first_name || ''} ${
      profile.last_name || ''
    }`.trim()
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={
              star <= Math.round(rating)
                ? 'currentColor'
                : 'none'
            }
            stroke="currentColor"
            strokeWidth="1.8"
            className={
              star <= Math.round(rating)
                ? 'text-yellow-500'
                : 'text-slate-300'
            }
          >
            <path d="M12 3.5l2.65 5.37 5.92.86-4.28 4.17 1.01 5.89L12 17.02l-5.3 2.78 1.01-5.89-4.28-4.17 5.92-.86L12 3.5z" />
          </svg>
        ))}
      </div>
    )
  }

  function formatTime(time: string) {
    if (!time) return ''

    const [hours, minutes] = time.split(':')
    const date = new Date()

    date.setHours(Number(hours))
    date.setMinutes(Number(minutes))

    return date.toLocaleTimeString('en-ZA', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getDayName(day: number) {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    return days[day] || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading mentor profile...
          </p>
        </div>
      </div>
    )
  }

  if (error || !mentor || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Mentor not found
        </h1>

        <p className="mt-2 text-slate-500">
          {error || 'This mentor profile is unavailable.'}
        </p>

        <button
          onClick={() => router.push('/mentors')}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Back to Mentors
        </button>
      </div>
    )
  }

  const rating =
    reviews.length > 0
      ? reviews.reduce(
          (total, review) =>
            total + Number(review.rating),
          0
        ) / reviews.length
      : 0

  const availabilityStatus =
    mentor.availability_status ||
    'not_available'

  const canStartNewChat =
    availabilityStatus !== 'not_available'

  const statusLabel =
    availabilityStatus === 'active'
      ? 'Active'
      : availabilityStatus === 'busy'
      ? 'Busy'
      : 'Not Available'

  const statusClasses =
    availabilityStatus === 'active'
      ? 'bg-green-100 text-green-700'
      : availabilityStatus === 'busy'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-600'

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Back */}
        <button
          onClick={() => router.push('/mentors')}
          className="mb-6 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          ← Back to Mentors
        </button>

        {/* Profile Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row">

            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={getFullName()}
                  className="h-32 w-32 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-900 text-4xl font-bold text-white">
                  {getFullName()
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Information */}
            <div className="flex-1">

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {getFullName()}
                </h1>

                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  Mentor
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses}`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  {mentor.year_of_study || 'Year not set'}
                </span>

                {profile.faculty && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {profile.faculty}
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="mt-5 flex items-center gap-3">
                {renderStars(rating)}

                <span className="font-semibold text-slate-800">
                  {rating.toFixed(1)}
                </span>

                <span className="text-sm text-slate-500">
                  ({reviews.length} reviews)
                </span>
              </div>

              {/* Sessions */}
              <p className="mt-3 text-sm text-slate-500">
                {closedSessionCount} mentoring{' '}
                {closedSessionCount === 1
                  ? 'session'
                  : 'sessions'}{' '}
                completed
              </p>

              {/* Bio */}
              <p className="mt-5 max-w-3xl leading-7 text-slate-600">
                {mentor.bio ||
                  'This mentor has not added a bio yet.'}
              </p>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">

                {canStartNewChat ? (
                  <button
                    onClick={() =>
                      router.push(`/chat?mentor=${mentor.id}`)
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {availabilityStatus === 'busy'
                      ? 'Message Anyway'
                      : 'Start Message'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl bg-gray-200 px-6 py-3 font-semibold text-gray-500"
                  >
                    Mentor Not Available
                  </button>
                )}

                <button
                  onClick={() => router.push('/mentors')}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Mentors
                </button>

              </div>
            </div>
          </div>
        </section>

        {/* Modules + Availability */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* Modules */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Modules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Modules this mentor can assist with.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {modules.length > 0 ? (
                modules.map((module) => (
                  <span
                    key={module.id}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                  >
                    {module.module_name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No modules listed yet.
                </p>
              )}
            </div>
          </section>

          {/* Availability */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Availability
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              When this mentor is available.
            </p>

            <div className="mt-4">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses}`}
              >
                Current status: {statusLabel}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {availability.length > 0 ? (
                availability.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-700">
                      {getDayName(slot.day_of_week)}
                    </span>

                    <span className="text-sm text-slate-600">
                      {formatTime(slot.start_time)} –{' '}
                      {formatTime(slot.end_time)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No availability has been added yet.
                </p>
              )}
            </div>
          </section>

        </div>

        {/* Reviews */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Student Reviews
          </h2>

          {reviews.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No reviews yet.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-slate-100 pb-5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating)}

                    <span className="text-xs text-slate-400">
                      {new Date(
                        review.created_at
                      ).toLocaleDateString('en-ZA')}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-3 leading-6 text-slate-600">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}