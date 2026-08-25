'use client'

import { useRef } from 'react'
import PrintButton from './PrintButtom'

interface Profile {
  first_name: string
  last_name: string
  student_number: string
  faculty: string
}

interface Props {
  profile: Profile
}

export default function CertificateView({ profile }: Props) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const certificateNumber = `FYE-${new Date().getFullYear()}-${profile.student_number}`

  return (
    <div className="min-h-screen bg-slate-200 py-12">

      <div className="mx-auto mb-8 flex max-w-5xl justify-end">

        <PrintButton certificateRef={certificateRef} />

      </div>

      <div
        ref={certificateRef}
        className="mx-auto max-w-5xl rounded-lg border-[12px] border-blue-900 bg-[#fffdf5] p-6 shadow-2xl"
      >
        <div className="relative border-[6px] border-yellow-500 p-10">

          {/* Graduation Cap */}

          <div className="flex justify-center">
            <img
              src="/graduation-cap.png"
              alt="Graduation Cap"
              className="h-16 w-16 object-contain"
            />
          </div>

          {/* University */}

          <h2 className="mt-4 text-center text-lg font-semibold tracking-[0.4em] text-blue-900">
            UNIVERSITY OF MPUMALANGA
          </h2>

          <p className="mt-2 text-center text-sm uppercase tracking-[0.3em] text-slate-500">
            First Year Experience Hub
          </p>

          {/* Heading */}

          <h1 className="mt-10 text-center font-serif text-5xl italic text-blue-900">
            Certificate of Completion
          </h1>

          <p className="mt-8 text-center text-lg text-slate-600">
            This certificate is proudly presented to
          </p>

          {/* Student Name */}

          <h2 className="mt-6 text-center font-serif text-6xl italic text-red-800">
            {profile.first_name} {profile.last_name}
          </h2>

          <div className="mt-10 space-y-4 text-center text-lg">

            <p>
              <strong>Student Number:</strong>{' '}
              {profile.student_number}
            </p>

            <p>
              <strong>Faculty:</strong>{' '}
              {profile.faculty}
            </p>

            <p>
              For successfully completing the
            </p>

            <h3 className="text-2xl font-semibold text-blue-900">
              First Year Experience Orientation Programme
            </h3>

            <p className="mt-4">
              Awarded the
            </p>

            <div className="flex items-center justify-center gap-3">

              <h2 className="text-4xl font-bold text-yellow-600">
                GOLD BADGE
              </h2>

              <img
                src="/gold-badge.png"
                alt="Gold Badge"
                className="h-14 w-14 -rotate-12 drop-shadow-md"
              />

            </div>

            <p>
              <strong>Certificate Number:</strong>{' '}
              {certificateNumber}
            </p>

            <p>
              <strong>Completion Date:</strong>{' '}
              {today}
            </p>

          </div>

          {/* Signatures */}

          <div className="mt-24 grid grid-cols-2 gap-16">

            <div className="text-center">

              <p
                className="text-4xl italic text-slate-700"
                style={{ fontFamily: 'cursive' }}
              >
                {profile.last_name}
              </p>

              <div className="mt-2 border-t border-black" />

              <p className="mt-2">
                Student Signature
              </p>

            </div>

            <div className="text-center">

              <p
                className="text-4xl italic text-slate-700"
                style={{ fontFamily: 'cursive' }}
              >
                FYE HUB TEAM
              </p>

              <div className="mt-2 border-t border-black" />

              <p className="mt-2">
                Programme Coordinator
              </p>

            </div>

          </div>

          {/* Footer */}

          <div className="mt-16 text-center">

            <p className="text-xl">
              Congratulations and welcome to the University of Mpumalanga!
            </p>

            <p className="mt-4 text-sm text-slate-500">
              This certificate officially recognises the successful completion
              of the First Year Experience Orientation Programme and the
              achievement of the Gold Badge.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}