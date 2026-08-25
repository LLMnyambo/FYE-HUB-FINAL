import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function AdminOverviewPage() {
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

  // Total students
  const {
  data: studentData,
  count: students,
  error: studentError,
} = await supabase
  .from('profiles')
  .select('*', { count: 'exact' })
  .eq('role', 'student')

console.log('Students:', studentData)
console.log('Count:', students)
console.log('Error:', studentError)
  // Total mentors
  const { count: mentors } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'mentor')

  // Total orientation tasks
  const { count: tasks } = await supabase
    .from('orientation_tasks')
    .select('*', { count: 'exact', head: true })

  // Published announcements
  const { count: announcements } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-primary">
          Admin Dashboard
        </h1>

        <p className="text-muted-foreground">
          Manage the FYE Hub platform
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Total Students
            </p>
            <p className="text-2xl font-bold">
              {students ?? 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Active Mentors
            </p>
            <p className="text-2xl font-bold">
              {mentors ?? 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Orientation Tasks
            </p>
            <p className="text-2xl font-bold">
              {tasks ?? 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Published Announcements
            </p>
            <p className="text-2xl font-bold">
              {announcements ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}