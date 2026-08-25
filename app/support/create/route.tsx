import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const formData = await request.formData()

  const subject = formData.get('subject') as string
  const category = formData.get('category') as string
  const message = formData.get('message') as string

  // Generate ticket number
  const ticketNumber =
    'FYE-' +
    new Date().getFullYear() +
    '-' +
    Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      student_id: session.user.id,
      subject,
      category,
      message,
      ticket_number: ticketNumber,
    })

  if (error) {
  console.error('SUPABASE ERROR:', error)
  return new Response(
    JSON.stringify(error),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

  return NextResponse.redirect(
    new URL(
      `/support?success=1&ticket=${ticketNumber}`,
      request.url
    )
  )
}