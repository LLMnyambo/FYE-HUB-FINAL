import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublished,
  updateAnnouncement,
} from './actions'

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string
    created?: string
    updated?: string
    deleted?: string
    status?: string
  }>
}) {
  const params = await searchParams

  const editId =
    params.edit || ''

  const created =
    params.created === 'true'

  const updated =
    params.updated === 'true'

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
    data: announcements,
    error,
  } = await supabase
    .from('announcements')
    .select(`
      id,
      author_id,
      title,
      body,
      urgency,
      is_published,
      published_at,
      created_at
    `)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        {error.message}
      </div>
    )
  }

  const announcementList =
    announcements || []

  const publishedCount =
    announcementList.filter(
      (announcement) =>
        announcement.is_published
    ).length

  const draftCount =
    announcementList.filter(
      (announcement) =>
        !announcement.is_published
    ).length

  const urgentCount =
    announcementList.filter(
      (announcement) =>
        announcement.urgency === 'urgent'
    ).length

  const editingAnnouncement =
    editId
      ? announcementList.find(
          (announcement) =>
            announcement.id === editId
        )
      : null

  return (
    <div className="space-y-8 pb-10">

      <Link
        href="/admin"
        className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        ← Back to Admin
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Announcement Management
        </h1>

        <p className="mt-2 text-gray-500">
          Create, publish and manage announcements for students.
        </p>
      </div>

      {created && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ Announcement created successfully.
        </div>
      )}

      {updated && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ Announcement changes saved successfully.
        </div>
      )}

      {deleted && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ Announcement deleted successfully.
        </div>
      )}

      {status === 'published' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ Announcement published successfully.
        </div>
      )}

      {status === 'unpublished' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ Announcement unpublished successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Announcements
          </p>

          <p className="mt-2 text-3xl font-bold">
            {announcementList.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Published
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Drafts
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-600">
            {draftCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Urgent
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {urgentCount}
          </p>
        </div>

      </div>

      <section className="rounded-xl border bg-white p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          {editingAnnouncement
            ? 'Edit Announcement'
            : 'Create Announcement'}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Draft announcements do not notify students until they are published.
        </p>

        <form
          action={
            editingAnnouncement
              ? updateAnnouncement
              : createAnnouncement
          }
          className="mt-6 space-y-6"
        >

          {editingAnnouncement && (
            <input
              type="hidden"
              name="id"
              value={
                editingAnnouncement.id
              }
            />
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Title
              </label>

              <input
                name="title"
                required
                defaultValue={
                  editingAnnouncement?.title ||
                  ''
                }
                placeholder="Announcement title"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Urgency
              </label>

              <select
                name="urgency"
                required
                defaultValue={
                  editingAnnouncement?.urgency ||
                  'normal'
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="normal">
                  Normal
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Announcement
            </label>

            <textarea
              name="body"
              required
              rows={6}
              defaultValue={
                editingAnnouncement?.body ||
                ''
              }
              placeholder="Write the announcement..."
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              {editingAnnouncement
                ? 'Save Changes'
                : 'Create Draft'}
            </button>

            {editingAnnouncement && (
              <Link
                href="/admin/announcements"
                className="rounded-lg border px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            )}

          </div>

        </form>

      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Announcements
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage drafts and published announcements.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">
              <tr>

                <th className="px-5 py-4 text-left">
                  Announcement
                </th>

                <th className="px-5 py-4 text-left">
                  Urgency
                </th>

                <th className="px-5 py-4 text-left">
                  Status
                </th>

                <th className="px-5 py-4 text-left">
                  Published
                </th>

                <th className="px-5 py-4 text-center">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {announcementList.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-500"
                  >
                    No announcements yet.
                  </td>
                </tr>

              ) : (

                announcementList.map(
                  (announcement) => (

                    <tr
                      key={announcement.id}
                      className="border-t"
                    >

                      <td className="px-5 py-4">

                        <p className="font-semibold text-gray-900">
                          {announcement.title}
                        </p>

                        <p className="mt-1 max-w-xl truncate text-sm text-gray-500">
                          {announcement.body}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            announcement.urgency === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {announcement.urgency === 'urgent'
                            ? 'Urgent'
                            : 'Normal'}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            announcement.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {announcement.is_published
                            ? 'Published'
                            : 'Draft'}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {announcement.published_at
                          ? new Date(
                              announcement.published_at
                            ).toLocaleString(
                              'en-ZA'
                            )
                          : '—'}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex flex-wrap justify-center gap-2">

                          <Link
                            href={`/admin/announcements?edit=${announcement.id}`}
                            className="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                          >
                            Edit
                          </Link>

                          <form
                            action={
                              toggleAnnouncementPublished
                            }
                          >

                            <input
                              type="hidden"
                              name="id"
                              value={
                                announcement.id
                              }
                            />

                            <input
                              type="hidden"
                              name="published"
                              value={
                                announcement.is_published
                                  ? 'false'
                                  : 'true'
                              }
                            />

                            <button
                              type="submit"
                              className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                announcement.is_published
                                  ? 'bg-slate-600 hover:bg-slate-700'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {announcement.is_published
                                ? 'Unpublish'
                                : 'Publish'}
                            </button>

                          </form>

                          <form
                            action={
                              deleteAnnouncement
                            }
                          >

                            <input
                              type="hidden"
                              name="id"
                              value={
                                announcement.id
                              }
                            />

                            <button
                              type="submit"
                              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Delete
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

      </section>

    </div>
  )
}