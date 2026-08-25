import { logout } from '@/app/actions/logout'

interface AdminHeaderProps {
  name: string
}

export default function AdminHeader({
  name,
}: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          Welcome, {name}
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white transition hover:bg-red-700"
        >
          Sign Out
        </button>
      </form>

    </header>
  )
}