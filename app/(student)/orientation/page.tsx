
import Link from 'next/link'
import Confetti from './Confetti'
import BadgeCelebration from './BadgeCelebration'
import { completeTask, undoTask } from './actions'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface OrientationTask {
  id: string
  title: string
  description: string
  category: string
  points: number
  sort_order: number
}

interface StudentTaskProgress {
  task_id: string
}

export default async function OrientationPage() {
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
    redirect('/login')
  }

  const { data: tasks } = await supabase
    .from('orientation_tasks')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: completed } = await supabase
    .from('student_task_progress')
    .select('task_id')
    .eq('student_id', session.user.id)

  const orientationTasks = (tasks as OrientationTask[]) ?? []

  const completedTasks = (completed as StudentTaskProgress[]) ?? []

  const completedIds = completedTasks.map(task => task.task_id)

  const completedCount = completedTasks.length

  const totalTasks = orientationTasks.length

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedCount / totalTasks) * 100)

  const points = orientationTasks
    .filter(task => completedIds.includes(task.id))
    .reduce((sum, task) => sum + task.points, 0)

  let badge = 'No Badge'
  let badgeIcon = '⬡'
  let badgeColor = 'text-slate-400'

  if (completedCount >= 2) {
    badge = 'Bronze Badge'
    badgeIcon = '🥉'
    badgeColor = 'text-amber-600'
  }

  if (completedCount >= 4) {
    badge = 'Silver Badge'
    badgeIcon = '🥈'
    badgeColor = 'text-slate-500'
  }

  if (completedCount >= 6) {
    badge = 'Gold Badge'
    badgeIcon = '🥇'
    badgeColor = 'text-yellow-500'
  }

  return (
    <>
      <BadgeCelebration badge={badge} />
      <Confetti progress={progress} />

      <div className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-7xl p-8">

          {/* ================= HERO ================= */}

          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-10 text-white shadow-xl">

            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-300">
                  FYE HUB
                </p>

                <h1 className="text-5xl font-bold">
                  Orientation Journey
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Complete all six orientation activities to earn
                  points, unlock badges and successfully complete
                  your First Year Experience programme.
                </p>

              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur">

                <p className="text-sm uppercase tracking-widest text-slate-300">
                  Progress
                </p>

                <h2 className="mt-3 text-6xl font-black">
                  {progress}%
                </h2>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/20">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />

                </div>

                <p className="mt-4 text-sm text-slate-300">
                  {completedCount} of {totalTasks} tasks completed
                </p>

                {completedCount === totalTasks && totalTasks > 0 && (

                  <div className="mt-6">

                    <Link
                      href="/orientation/certificate"
                      className="inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-7 py-4 font-bold text-slate-900 shadow-lg transition hover:scale-105 hover:bg-yellow-300"
                    >
                      Download Certificate
                    </Link>

                  </div>

                )}

              </div>

            </div>

          </div>
                  {/* ================= DASHBOARD ================= */}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* Tasks */}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Tasks Completed
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              {completedCount}/{totalTasks}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Keep progressing through your orientation.
            </p>

          </div>

          {/* Points */}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Orientation Points
            </p>

            <h2 className="mt-3 text-4xl font-bold text-amber-500">
              {points}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Earn points by completing activities.
            </p>

          </div>

          {/* Completion */}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Completion
            </p>

            <h2 className="mt-3 text-4xl font-bold text-blue-600">
              {progress}%
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              You're making great progress.
            </p>

          </div>

          {/* Badge */}

          <div className="rounded-3xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 p-6 text-white shadow-lg">

            <p className="text-sm uppercase tracking-widest">
              Current Badge
            </p>

            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl">

                {badgeIcon}

              </div>

              <div>

                <h2 className={`text-2xl font-bold ${badgeColor}`}>
                  {badge}
                </h2>

                <p className="mt-2 text-sm text-yellow-100">

                  {badge === 'Gold Badge'
                    ? 'Outstanding! You have successfully completed the First Year Experience Orientation Programme.'
                    : badge === 'Silver Badge'
                    ? 'Only two more activities to earn the Gold Badge.'
                    : badge === 'Bronze Badge'
                    ? 'Excellent start! Keep going to unlock higher achievements.'
                    : 'Complete activities to earn your first badge.'}

                </p>

              </div>

            </div>

          </div>

        </div>



        {/* ================= CHECKLIST ================= */}

        <div className="mt-10 rounded-3xl border bg-white shadow-sm">

          <div className="border-b p-6">

            <h2 className="text-2xl font-bold text-slate-900">
              Orientation Checklist
            </h2>

            <p className="mt-2 text-slate-500">
              Complete each activity to finish your orientation journey.
            </p>

          </div>

          <div className="divide-y">

            {orientationTasks.map((task, index) => {

              const isCompleted = completedIds.includes(task.id)

              return (

                <div
                  key={task.id}
                  className="flex flex-col gap-6 p-6 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                >

                  <div className="flex flex-1 items-start gap-5">

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-xl font-semibold text-slate-900">
                          {task.title}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {task.category}
                        </span>

                      </div>

                      <p className="mt-3 text-slate-500">
                        {task.description}
                      </p>

                      <div className="mt-4 flex items-center gap-3">

                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                          +{task.points} Points
                        </span>

                        {isCompleted && (

                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                            Completed
                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Complete Button */}

                    <form action={completeTask}>

                      <input
                        type="hidden"
                        name="taskId"
                        value={task.id}
                      />

                      <button
                        type="submit"
                        disabled={isCompleted}
                        className={`rounded-xl px-6 py-3 font-semibold text-white transition ${
                          isCompleted
                            ? 'cursor-not-allowed bg-slate-400'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        Complete Task
                      </button>

                    </form>

                    {/* Undo Button */}

                    <form action={undoTask}>

                      <input
                        type="hidden"
                        name="taskId"
                        value={task.id}
                      />

                      <button
                        type="submit"
                        disabled={!isCompleted}
                        className={`rounded-xl px-6 py-3 font-semibold transition ${
                          isCompleted
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'cursor-not-allowed border border-slate-300 bg-slate-100 text-slate-400'
                        }`}
                      >
                        Undo
                      </button>

                    </form>

                  </div>

                </div>

              )

            })}

          </div>

        </div>

      </div>

    </div>

    </>

  )

}