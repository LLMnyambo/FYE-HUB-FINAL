'use client'

import { useEffect, useState } from 'react'

interface Props {
  badge: string
}

export default function BadgeCelebration({ badge }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (badge === 'No Badge') return

    const lastBadge = localStorage.getItem('lastBadgeShown')

    if (lastBadge !== badge) {
      setOpen(true)
      localStorage.setItem('lastBadgeShown', badge)
    }
  }, [badge])

  if (!open) return null

  const badgeColor =
    badge === 'Bronze Badge'
      ? 'from-amber-700 to-orange-400'
      : badge === 'Silver Badge'
      ? 'from-slate-400 to-slate-200'
      : 'from-yellow-400 to-yellow-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-12 text-center shadow-2xl">

        <div
          className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${badgeColor} shadow-xl`}
        >
          <span className="text-7xl">🏅</span>
        </div>

        <h1 className="mt-8 text-5xl font-black text-slate-900">
          Congratulations!
        </h1>

        <p className="mt-4 text-xl text-slate-600">
          You have unlocked
        </p>

        <h2 className="mt-3 text-4xl font-bold text-amber-600">
          {badge}
        </h2>

        <p className="mt-6 text-slate-500">
          Outstanding achievement! You have successfully completed the entire FYE Hub Orientation journey. We wish you every success in your academic journey at UMP.
        </p>

        <button
          onClick={() => setOpen(false)}
          className="mt-10 rounded-2xl bg-slate-900 px-10 py-4 text-lg font-semibold text-white transition hover:scale-105 hover:bg-slate-800"
        >
          Continue
        </button>

      </div>
    </div>
  )
}