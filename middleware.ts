import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { FRONTEND_URL } from '@/lib/server-urls'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If the request is for the root path, redirect to /vmsapp
  if (pathname === '/') {
    return NextResponse.redirect(new URL(FRONTEND_URL, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/'
}
