import RealtimeRefresh from './RealtimeRefresh'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  createOrientationTask,
  deleteOrientationTask,
  toggleOrientationTask,
  updateOrientationTask,
} from './actions'

export default async function AdminOrientationPage({
  searchParams,
}: {
  searchParams: Promise<{
  student?: string
  edit?: string
  updated?: string
  created?: string
  deleted?: string
  status?: string
}>
}) {
  const params = await searchParams

  const studentNumber =
    params.student?.trim() || ''

  const editTaskId =
    params.edit || ''

    const updated =
  params.updated === 'true'

  const created =
  params.created === 'true'

const deleted =
  params.deleted === 'true'

const status =
  params.status || ''

  const cookieStore =
    await cookies()

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
    data: tasks,
    error: taskError,
  } = await supabase
    .from('orientation_tasks')
    .select(`
      id,
      title,
      description,
      category,
      points,
      sort_order,
      is_active,
      created_at
    `)
    .order('sort_order')
    .order('created_at')

  if (taskError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        {taskError.message}
      </div>
    )
  }

  const taskList =
    tasks || []

  const {
    data: progressRows,
  } = await supabase
    .from('student_task_progress')
    .select(`
      id,
      student_id,
      task_id,
      completed_at
    `)

  const progress =
    progressRows || []

  const activeTasks =
    taskList.filter(
      (task) => task.is_active
    ).length

  const totalCompletions =
    progress.length

  const editingTask =
    editTaskId
      ? taskList.find(
          (task) =>
            task.id === editTaskId
        )
      : null

  let searchedStudent: any = null
  let studentProgress: any[] = []

  if (studentNumber) {
    const {
      data: student,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        student_number,
        first_name,
        last_name,
        email,
        faculty,
        orientation_points
      `)
      .eq(
        'student_number',
        studentNumber
      )
      .maybeSingle()

    searchedStudent =
      student

    if (student) {
      const completed =
        progress.filter(
          (item) =>
            item.student_id ===
            student.id
        )

      studentProgress =
        taskList.map(
          (task) => {
            const progressItem =
              completed.find(
                (item) =>
                  item.task_id ===
                  task.id
              )

            return {
              ...task,
              completed:
                !!progressItem,
              completed_at:
                progressItem?.completed_at ||
                null,
            }
          }
        )
    }
  }

  const completedCount =
    studentProgress.filter(
      (task) =>
        task.completed
    ).length
const calculatedPoints =
  studentProgress
    .filter((task) => task.completed)
    .reduce(
      (total, task) =>
        total + Number(task.points || 0),
      0
    )

let calculatedBadge = 'No Badge'

  if (completedCount >= 2) {
    calculatedBadge = 'Bronze Badge'
  }

  if (completedCount >= 4) {
    calculatedBadge = 'Silver Badge'
  }

  if (completedCount >= 6) {
    calculatedBadge = 'Gold Badge'
  }


  const remainingCount =
    studentProgress.length -
    completedCount

  return (
    <div className="space-y-8 pb-10">

      {/* HEADER */}
<Link
  href="/admin"
  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  ← Back to Admin
</Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Orientation Management
        </h1>

        <p className="mt-2 text-gray-500">
          Manage orientation tasks and monitor student progress.
        </p>
      </div>

      {updated && (
  <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
    ✓ Changes successfully saved.
  </div>
)}

{created && (
  <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
    ✓ Orientation task created successfully.
  </div>
)}

{deleted && (
  <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
    ✓ Orientation task deleted successfully.
  </div>
)}

{status === 'enabled' && (
  <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
    ✓ Orientation task enabled successfully.
  </div>
)}

{status === 'disabled' && (
  <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
    ✓ Orientation task disabled successfully.
  </div>
)}


      {/* GLOBAL STATS */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Tasks
          </p>

          <p className="mt-2 text-3xl font-bold">
            {taskList.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Active Tasks
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {activeTasks}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Student Completions
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {totalCompletions}
          </p>
        </div>

      </div>

      {/* STUDENT SEARCH */}

      <section className="rounded-xl border bg-white p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          Student Orientation Progress
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Search for a student using their student number.
        </p>

        <form
          action="/admin/orientation"
          method="GET"
          className="mt-5 flex flex-wrap gap-3"
        >

          <input
            type="text"
            name="student"
            defaultValue={
              studentNumber
            }
            placeholder="Enter student number..."
            className="w-80 rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Search Student
          </button>

          {studentNumber && (
            <Link
              href="/admin/orientation"
              className="rounded-lg border px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}

        </form>

        {studentNumber &&
          !searchedStudent && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              No student found with student number{' '}
              {studentNumber}.
            </div>
          )}

        {searchedStudent && (
          <div className="mt-8">

            <div className="rounded-xl bg-gray-50 p-6">

              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {
                      searchedStudent.first_name
                    }{' '}
                    {
                      searchedStudent.last_name
                    }
                  </h3>

                  <p className="mt-1 text-gray-500">
                    Student Number:{' '}
                    {
                      searchedStudent.student_number
                    }
                  </p>

                  <p className="text-sm text-gray-500">
                    {
                      searchedStudent.faculty ||
                      'Faculty not set'
                    }
                  </p>

                  <p className="text-sm text-gray-500">
                    {
                      searchedStudent.email
                    }
                  </p>
                </div>

                <div className="text-left md:text-right">

                  <p className="text-sm text-gray-500">
                    Orientation Points
                  </p>

                  <p className="text-3xl font-bold text-blue-600">
                    {calculatedPoints}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-700">
                    Badge:{' '}
                  {calculatedBadge}
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

              <div className="rounded-lg border p-5">
                <p className="text-sm text-gray-500">
                  Total Tasks
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {
                    studentProgress.length
                  }
                </p>
              </div>

              <div className="rounded-lg border p-5">
                <p className="text-sm text-gray-500">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
              </div>

              <div className="rounded-lg border p-5">
                <p className="text-sm text-gray-500">
                  Remaining
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {remainingCount}
                </p>
              </div>

            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border">

              <table className="min-w-full bg-white">

                <thead className="bg-gray-100">
                  <tr>

                    <th className="px-5 py-4 text-left">
                      Task
                    </th>

                    <th className="px-5 py-4 text-left">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left">
                      Points
                    </th>

                    <th className="px-5 py-4 text-left">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left">
                      Completed At
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {studentProgress.map(
                    (task) => (

                      <tr
                        key={task.id}
                        className="border-t"
                      >

                        <td className="px-5 py-4 font-medium">
                          {task.title}
                        </td>

                        <td className="px-5 py-4">
                          {task.category}
                        </td>

                        <td className="px-5 py-4">
                          {task.points}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              task.completed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {task.completed
                              ? 'Completed'
                              : 'Pending'}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {task.completed_at
                            ? new Date(
                                task.completed_at
                              ).toLocaleString(
                                'en-ZA'
                              )
                            : '—'}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </section>

      {/* CREATE / EDIT TASK */}

      <section className="rounded-xl border bg-white p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          {editingTask
            ? 'Edit Orientation Task'
            : 'Create Orientation Task'}
        </h2>

        <form
          action={
            editingTask
              ? updateOrientationTask
              : createOrientationTask
          }
          className="mt-6 space-y-6"
        >

          {editingTask && (
            <input
              type="hidden"
              name="id"
              value={
                editingTask.id
              }
            />
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Title
              </label>

              <input
                name="title"
                required
                defaultValue={
                  editingTask?.title ||
                  ''
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category
              </label>

              <input
                name="category"
                required
                defaultValue={
                  editingTask?.category ||
                  ''
                }
                placeholder="e.g. Academic"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>



            <div>
              <label className="mb-2 block text-sm font-semibold">
                Points
              </label>

              <input
                type="number"
                min="0"
                name="points"
                required
                defaultValue={
                  editingTask?.points ??
                  0
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>



            <div>
              <label className="mb-2 block text-sm font-semibold">
                Sort Order
              </label>

              <input
                type="number"
                name="sortOrder"
                defaultValue={
                  editingTask?.sort_order ??
                  0
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>

            <textarea
              name="description"
              required
              rows={4}
              defaultValue={
                editingTask?.description ||
                ''
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="flex gap-3">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              {editingTask
                ? 'Save Changes'
                : 'Create Task'}
            </button>

            {editingTask && (
              <Link
                href="/admin/orientation"
                className="rounded-lg border px-6 py-3 font-semibold hover:bg-gray-50"
              >
                Cancel
              </Link>
            )}

          </div>

        </form>

      </section>

      {/* TASK LIST */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Orientation Tasks
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage all student orientation activities.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">
              <tr>

                <th className="px-5 py-4 text-left">
                  Task
                </th>

                <th className="px-5 py-4 text-left">
                  Category
                </th>

                <th className="px-5 py-4 text-left">
                  Points
                </th>

                <th className="px-5 py-4 text-left">
                  Completions
                </th>

                <th className="px-5 py-4 text-left">
                  Status
                </th>

                <th className="px-5 py-4 text-center">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {taskList.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-gray-500"
                  >
                    No orientation tasks yet.
                  </td>
                </tr>

              ) : (

                taskList.map(
                  (task) => {
                    const completionCount =
                      progress.filter(
                        (item) =>
                          item.task_id ===
                          task.id
                      ).length

                    return (
                      <tr
                        key={task.id}
                        className="border-t"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {task.title}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-gray-400">
                            {task.description}
                          </p>

                        </td>

                        <td className="px-5 py-4">
                          {task.category}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {task.points}
                        </td>

                        <td className="px-5 py-4">
                          {completionCount}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              task.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {task.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex flex-wrap justify-center gap-2">

                            <Link
                              href={`/admin/orientation?edit=${task.id}`}
                              className="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                            >
                              Edit
                            </Link>

                            <form
                              action={
                                toggleOrientationTask
                              }
                            >

                              <input
                                type="hidden"
                                name="id"
                                value={
                                  task.id
                                }
                              />

                              <input
                                type="hidden"
                                name="active"
                                value={
                                  task.is_active
                                    ? 'false'
                                    : 'true'
                                }
                              />

                              <button
                                type="submit"
                                className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                  task.is_active
                                    ? 'bg-slate-600 hover:bg-slate-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {task.is_active
                                  ? 'Disable'
                                  : 'Enable'}
                              </button>

                            </form>

                            <form
                              action={
                                deleteOrientationTask
                              }
                            >

                              <input
                                type="hidden"
                                name="id"
                                value={
                                  task.id
                                }
                              />

                              <button
                                type="submit"
                                disabled={
                                  completionCount >
                                  0
                                }
                                className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Delete
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

      </section>

    </div>
  )
}