'use client'

import { useActionState, useState } from 'react'
import { login } from './actions'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { error: '' })
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)

  const usesStudentNumber =
    role === 'student' || role === 'mentor'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-3 text-slate-500">
            Sign in to continue your orientation journey.
          </p>
        </div>

        {/* Role Selector */}
        <div className="mt-10">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Login As
          </label>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`rounded-xl py-3 font-semibold transition ${
                role === 'student'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'border border-slate-300 bg-white hover:bg-slate-100'
              }`}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => setRole('mentor')}
              className={`rounded-xl py-3 font-semibold transition ${
                role === 'mentor'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'border border-slate-300 bg-white hover:bg-slate-100'
              }`}
            >
              Mentor
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`rounded-xl py-3 font-semibold transition ${
                role === 'admin'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'border border-slate-300 bg-white hover:bg-slate-100'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form action={formAction} className="mt-8 space-y-6">

          <input
            type="hidden"
            name="role"
            value={role}
          />

          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {state.error}
            </div>
          )}

          {/* Student Number / Admin Email */}
          <div>
            <label
              htmlFor={
                usesStudentNumber
                  ? 'studentNumber'
                  : 'email'
              }
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {usesStudentNumber
                ? 'Student Number'
                : 'Admin Email'}
            </label>

            {usesStudentNumber ? (
              <input
                id="studentNumber"
                name="studentNumber"
                type="text"
                inputMode="numeric"
                placeholder="Enter your student number"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            ) : (
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your admin email"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-yellow-500"
              />

              Remember me
            </label>

            <Link
  href="/forgot-password"
  className="text-sm font-medium text-blue-600 hover:underline"
>
  Forgot password?
</Link>

          </div>

          {/* Login */}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-slate-800 hover:shadow-xl"
          >
            {role === 'student'
              ? 'Sign In as Student'
              : role === 'mentor'
              ? 'Sign In as Mentor'
              : 'Sign In as Admin'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Student Registration */}
          {role === 'student' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-600">
                New student?
              </p>

              <Link
                href="/register"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-yellow-400"
              >
                Create Student Account
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-slate-500">
              First Year Experience Hub
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Secure access for students, mentors and administrators.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}