'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  {
    name: 'Overview',
    href: '/admin/overview',
  },
  {
    name: 'Students',
    href: '/admin/students',
  },
  {
    name: 'Mentors',
    href: '/admin/mentors',
  },
  {
    name: 'Orientation',
    href: '/admin/orientation',
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-slate-900 text-white">

      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold">
          FYE Hub
        </h1>

        <p className="text-sm text-slate-400">
          Administration
        </p>
      </div>

      <nav className="mt-6 space-y-2 px-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-4 py-3 transition ${
              pathname === link.href
                ? 'bg-blue-600'
                : 'hover:bg-slate-800'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}