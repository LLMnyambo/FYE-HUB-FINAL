import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A2A6C]">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold">🎓 FYE Hub</h1>
        <p className="mt-2 text-white/80">University of Mpumalanga</p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-[#F9A825] px-6 py-2 text-[#1A2A6C] font-semibold hover:bg-[#FFC107] transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md border-2 border-white/30 px-6 py-2 text-white hover:bg-white/10 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}