import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session
  const { pathname } = request.nextUrl

  console.log('🔍 Proxy - Path:', pathname, 'Authenticated:', isAuthenticated)

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/register', '/verify']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Protected routes (require auth)
  const protectedRoutes = [
  '/',
  '/home',
  '/mentors',
  '/orientation',
  '/map',
  '/chat',
  '/tutor',
  '/admin'
]
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Admin routes - only match /admin or /admin/*
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  
  // Tutor routes - ONLY match /tutor or /tutor/* (NOT /tutors)
  const isTutorRoute = pathname === '/tutor' || pathname.startsWith('/tutor/')

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && isProtectedRoute) {
    console.log('🔒 Redirecting to login - Not authenticated')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access public route
  if (isAuthenticated && isPublicRoute) {
    console.log('🏠 Redirecting to home - Already authenticated')
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Role-based access for admin
  if (isAuthenticated && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      console.log('⛔ Redirecting from admin - Not admin')
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }
// Mentor dashboard access
if (isAuthenticated && isTutorRoute) {
  // Admins can also access mentor routes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin') {
    console.log('Admin accessing mentor dashboard')
  } else {
    // Student must have a mentor_profiles record
    const { data: mentorProfile, error: mentorError } =
      await supabase
        .from('mentor_profiles')
        .select('id')
        .eq('profile_id', session.user.id)
        .maybeSingle()

    if (mentorError) {
      console.error(
        'Error checking mentor profile:',
        mentorError
      )

      return NextResponse.redirect(
        new URL('/home', request.url)
      )
    }

    if (!mentorProfile) {
      console.log(
        'Redirecting from mentor dashboard - User is not an approved mentor'
      )

      return NextResponse.redirect(
        new URL('/home', request.url)
      )
    }
  }
}

  console.log('✅ Allowing access to:', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}