'use client'

import {
  useActionState,
  useState,
} from 'react'

import {
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

import { register } from './actions'

export default function RegisterPage() {
  const [state, formAction] =
    useActionState(register, {
      error: '',
    })

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false)

  const hasMinLength =
    password.length >= 10

  const hasUppercase =
    /[A-Z]/.test(password)

  const hasNumber =
    /[0-9]/.test(password)

  const hasSpecialCharacter =
    /[^A-Za-z0-9]/.test(password)

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword

  const completedRequirements = [
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecialCharacter,
  ].filter(Boolean).length

  const passwordValid =
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialCharacter &&
    passwordsMatch

  let strengthLabel = 'Weak'

  if (completedRequirements === 4) {
    strengthLabel = 'Strong'
  } else if (
    completedRequirements >= 2
  ) {
    strengthLabel = 'Medium'
  }

  const strengthWidth =
    completedRequirements === 0
      ? '0%'
      : `${completedRequirements * 25}%`

  const strengthBarClass =
    strengthLabel === 'Strong'
      ? 'bg-green-600'
      : strengthLabel === 'Medium'
      ? 'bg-amber-500'
      : 'bg-red-500'

  function Requirement({
    met,
    children,
  }: {
    met: boolean
    children: React.ReactNode
  }) {
    return (
      <div
        className={`flex items-center gap-2 text-sm ${
          met
            ? 'text-green-600 line-through'
            : 'text-slate-500'
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            met
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-slate-300'
          }`}
        >
          {met && (
            <Check className="h-3 w-3" />
          )}
        </span>

        <span>{children}</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}

        <div className="text-center">

          <h1 className="text-3xl font-bold text-slate-900">
            Create Account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Join the FYE Hub
          </p>

        </div>

        {/* Form */}

        <form
          action={formAction}
          className="mt-8 space-y-5"
        >

          {state?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}

          {/* Name */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>

              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

            </div>

            <div>

              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700"
              >
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

            </div>

          </div>

          {/* Student Number */}

          <div>

            <label
              htmlFor="studentNumber"
              className="block text-sm font-medium text-slate-700"
            >
              Student Number
            </label>

            <input
              id="studentNumber"
              name="studentNumber"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

          </div>

          {/* Faculty */}

          <div>

            <label
              htmlFor="faculty"
              className="block text-sm font-medium text-slate-700"
            >
              Faculty
            </label>

            <select
              id="faculty"
              name="faculty"
              required
              defaultValue=""
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">
                Select Faculty
              </option>

              <option value="Agriculture">
                Agriculture
              </option>

              <option value="Education">
                Education
              </option>

              <option value="Science">
                Science
              </option>

              <option value="Social Sciences">
                Social Sciences
              </option>
            </select>

          </div>

          {/* Email */}

          <div>

            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Personal Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Register using your personal email. Your UMP
              student email will be available in your profile
              after registration.
            </p>

          </div>

          {/* Password */}

          <div>

            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <div className="relative mt-1">

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                minLength={10}
                autoComplete="new-password"
                className="block w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-14 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

          </div>

          {/* Password Strength */}

          {password.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <p className="text-sm font-medium text-slate-700">
                  Password strength
                </p>

                <span
                  className={`text-sm font-semibold ${
                    strengthLabel === 'Strong'
                      ? 'text-green-600'
                      : strengthLabel ===
                        'Medium'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {strengthLabel}
                </span>

              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthBarClass}`}
                  style={{
                    width:
                      strengthWidth,
                  }}
                />

              </div>

              <div className="mt-4 space-y-2">

                <Requirement
                  met={hasMinLength}
                >
                  At least 10 characters
                </Requirement>

                <Requirement
                  met={hasUppercase}
                >
                  At least one uppercase letter
                </Requirement>

                <Requirement
                  met={hasNumber}
                >
                  At least one number
                </Requirement>

                <Requirement
                  met={
                    hasSpecialCharacter
                  }
                >
                  At least one special character
                </Requirement>

              </div>

            </div>
          )}

          {/* Confirm Password */}

          <div>

            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm Password
            </label>

            <div className="relative mt-1">

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
                minLength={10}
                autoComplete="new-password"
                className={`block w-full rounded-lg border bg-white py-3 pl-4 pr-14 outline-none transition focus:ring-1 ${
                  confirmPassword.length ===
                  0
                    ? 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                    : passwordsMatch
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                }`}
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

            {confirmPassword.length >
              0 && (
              <p
                className={`mt-2 text-xs font-medium ${
                  passwordsMatch
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {passwordsMatch
                  ? 'Passwords match'
                  : 'Passwords do not match'}
              </p>
            )}

          </div>

          {/* Register */}

          <button
            type="submit"
            disabled={!passwordValid}
            className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
              passwordValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-slate-400'
            }`}
          >
            Register
          </button>

        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}

          <a
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in here
          </a>
        </p>

      </div>

    </div>
  )
}