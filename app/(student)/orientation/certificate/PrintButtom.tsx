'use client'

import { RefObject } from 'react'

interface Props {
  certificateRef: RefObject<HTMLDivElement | null>
}

export default function PrintButton({ certificateRef }: Props) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <button
      onClick={handlePrint}
      className="print:hidden rounded-xl bg-blue-900 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-blue-800"
    >
      Download PDF
    </button>
  )
}