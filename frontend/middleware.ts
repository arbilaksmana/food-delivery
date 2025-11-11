import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/checkout", "/orders"]
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  // Disabled for now; client-side guards handle auth using localStorage token.
  return NextResponse.next()
}

export const config = {
  // Disable middleware matching until cookie-based auth is implemented.
  matcher: [],
}
