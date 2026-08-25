import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

import {
  BookOpen,
  Award,
  MapPin,
  Bell,
  User,
  ArrowRight,
} from 'lucide-react'

export default async function HomePage() {
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
    return <div>Not logged in.</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return <div>Profile not found.</div>
  }

  const { data: tasks } = await supabase
    .from('orientation_tasks')
    .select('*')
    .eq('is_active', true)

  const { data: completed } = await supabase
    .from('student_task_progress')
    .select('task_id')
    .eq('student_id', session.user.id)

  const totalTasks = tasks?.length ?? 0
  const completedTasks = completed?.length ?? 0

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  const points =
    tasks
      ?.filter(task =>
        completed?.some(c => c.task_id === task.id)
      )
      .reduce((sum, task) => sum + task.points, 0) ?? 0

  let badge = 'Bronze'

  if (completedTasks >= 6) {
    badge = 'Gold'
  } else if (completedTasks >= 3) {
    badge = 'Silver'
  }

  const showCertificate = completedTasks >= totalTasks

  const hour = new Date().getHours()

  let greeting = 'Good Evening'

  if (hour < 12) {
    greeting = 'Good Morning'
  } else if (hour < 17) {
    greeting = 'Good Afternoon'
  }

  const umpEmail = profile.student_number
    ? `${profile.student_number}@ump.ac.za`
    : profile.email

  const { data: admin } = await supabase
  .from('admin_contact')
  .select('*')
  .limit(1)
  .single()

  const {
    data: announcements,
    error: announcementsError,
  } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      body,
      urgency,
      published_at,
      created_at
    `)
    .eq('is_published', true)
    .order('published_at', {
      ascending: false,
    })
    .limit(3)

  const latestAnnouncements =
    announcements || []

  return (
  <div className="min-h-screen bg-slate-50">

    {/* ================= HERO ================= */}

    <section className="relative overflow-hidden">

      {/* Background Video */}

      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-[40%_center] scale-110"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}

      <div className="absolute inset-0 bg-slate-900/65" />

      {/* Hero Content */}

      <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center justify-between px-8 py-20">

        {/* LEFT SIDE */}

        <div className="max-w-2xl text-white">

          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-slate-300">
            
          </p>

          <h1 className="text-6xl font-black leading-tight">

            {greeting},<br />

            {profile.first_name}

          </h1>

          <p className="mt-6 text-3xl font-semibold text-yellow-400">

            First Year Experience Hub

          </p>

          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-200">

            Continue your orientation journey by completing
            activities, earning points, unlocking badges and
            downloading your completion certificate.

          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <Link
              href="/orientation"
              className="rounded-xl bg-yellow-500 px-8 py-4 font-semibold text-slate-900 transition hover:bg-yellow-400"
            >
              Continue Journey
            </Link>

            {showCertificate && (

              <Link
                href="/orientation/certificate"
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                Download Certificate
              </Link>

            )}

          </div>

        </div> 

              {/* RIGHT SIDE */}

        <div className="hidden lg:block">

          <div className="w-[360px] rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">

            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">
              Orientation Progress
            </p>

            <h2 className="mt-5 text-7xl font-black text-white">
              {progress}%
            </h2>

            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/20">

              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />

            </div>

            <div className="mt-8 space-y-5 text-white">

              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Tasks Completed
                </span>

                <span className="font-semibold">
                  {completedTasks} / {totalTasks}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Points Earned
                </span>

                <span className="font-semibold">
                  {points}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Current Badge
                </span>

                <span className="font-semibold text-yellow-400">
                  {badge}
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
            {/* ================= DASHBOARD CARDS ================= */}

      {/* ================= DASHBOARD STATS ================= */}

        {/* ================= QUICK ACCESS & STUDENT INFO ================= */}

    <section className="mx-auto max-w-7xl px-8 pb-12">

      <div className="grid gap-8 lg:grid-cols-3">

        {/* ================= QUICK ACCESS ================= */}

        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Quick Access
          </h2>

          <p className="mt-2 text-slate-500">
            Navigate quickly to the most important areas of the FYE Hub.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <Link
              href="/orientation"
              className="rounded-2xl border border-slate-200 p-6 transition hover:border-blue-600 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Orientation
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Continue completing orientation activities.
              </p>
            </Link>

            <Link
              href="/orientation/certificate"
              className={`rounded-2xl border p-6 transition hover:shadow-lg ${
                showCertificate
                  ? 'border-slate-200 hover:border-blue-600'
                  : 'cursor-not-allowed border-slate-200 opacity-50'
              }`}
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Certificate
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Download your certificate after completing orientation.
              </p>
            </Link>

            <Link
              href="/campus-map"
              className="rounded-2xl border border-slate-200 p-6 transition hover:border-blue-600 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Campus Map
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Explore important buildings and facilities.
              </p>
            </Link>

            <Link
              href="/announcements"
              className="rounded-2xl border border-slate-200 p-6 transition hover:border-blue-600 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Announcements
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Stay updated with the latest FYE news.
              </p>
            </Link>

          </div>

        </div>

        {/* ================= STUDENT INFORMATION ================= */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Student Information
          </h2>

          <div className="mt-8 space-y-6">

            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-semibold text-slate-900">
                {profile.first_name} {profile.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Student Number</p>
              <p className="font-semibold text-slate-900">
                {profile.student_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-semibold text-slate-900 break-all">
                {umpEmail}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Current Badge</p>
              <p className="font-semibold text-yellow-600">
                {badge}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Progress</p>
              <p className="font-semibold text-blue-700">
                {progress}%
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
    {/* ================= ANNOUNCEMENTS ================= */}

    <section className="mx-auto max-w-7xl px-8 pb-12">

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Latest Announcements
            </h2>

            <p className="mt-2 text-slate-500">
              Stay updated with the latest information from FYE Hub.
            </p>
          </div>

          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>

        {announcementsError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            Unable to load announcements right now.
          </div>
        )}

        {!announcementsError && latestAnnouncements.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-400" />

            <h3 className="mt-4 font-semibold text-slate-800">
              No published announcements yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              New announcements will appear here when they are published.
            </p>
          </div>
        )}

        {!announcementsError && latestAnnouncements.length > 0 && (
          <div className="mt-8 space-y-5">

            {latestAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                className={`rounded-2xl border p-6 ${
                  announcement.urgency === 'urgent'
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-white'
                }`}
              >

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3
                        className={`text-lg font-semibold ${
                          announcement.urgency === 'urgent'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {announcement.title}
                      </h3>

                      {announcement.urgency === 'urgent' && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Urgent
                        </span>
                      )}

                    </div>

                    <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                      {announcement.body}
                    </p>

                  </div>

                  <div className="shrink-0 text-xs text-slate-400">
                    {announcement.published_at
                      ? new Date(
                          announcement.published_at
                        ).toLocaleString('en-ZA')
                      : ''}
                  </div>

                </div>

              </article>
            ))}

          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 p-6">

          <h3 className="text-lg font-semibold text-blue-700">
            Need Assistance?
          </h3>

          <p className="mt-3 leading-7 text-slate-600">
            If you need help completing your orientation activities,
            contact the system administrator.
          </p>

          <Link
            href="/support"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Contact Administrator
          </Link>

          <div className="mt-6 space-y-1 text-sm text-slate-500">

            <p>
              {admin?.administrator_name}
            </p>

            <p>
              {admin?.email}
            </p>

            {admin?.phone && (
              <p>
                <strong>Phone:</strong> {admin.phone}
              </p>
            )}

            {admin?.office && (
              <p>
                <strong>Office:</strong> {admin.office}
              </p>
            )}

          </div>

        </div>

      </div>

    </section>

    {/* ================= DAILY TIP ================= */}

    <section className="mx-auto max-w-7xl px-8 pb-16">

      <div className="rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 p-10 text-white shadow-xl">

        <h2 className="text-3xl font-bold">
          Daily Student Tip
        </h2>

        <p className="mt-5 max-w-3xl leading-8 text-slate-200">
          Students who complete orientation early are more likely
          to know where to find academic support, student services,
          campus facilities and important university information.
          Continue your journey to unlock your completion certificate.
        </p>

      </div>

    </section>

    {/* ================= FOOTER ================= */}

    <footer className="border-t border-slate-200 bg-white">

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-8 md:flex-row">

        <div>

          <h3 className="font-semibold text-slate-900">
            First Year Experience Hub
          </h3>

          <p className="text-sm text-slate-500">
            Student Orientation Portal
          </p>

        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} First Year Experience Hub.
        </p>

      </div>

    </footer>

  </div>
)
}