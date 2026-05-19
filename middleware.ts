import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory store for rate limiting
// Note: On serverless/edge environments, this state may reset when instances spin down or scale up,
// but it provides a functional baseline for DDoS/spam mitigation per instance.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 100 // maximum requests allowed per minute per IP

export function middleware(request: NextRequest) {
  // Apply rate limiting specifically to API routes to prevent abuse
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Extract client IP address
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    
    if (ip !== 'unknown') {
      const now = Date.now()
      const windowStart = now - RATE_LIMIT_WINDOW_MS
      
      const record = rateLimitMap.get(ip)

      if (!record || record.lastReset < windowStart) {
        // Initialize or reset the window for this IP
        rateLimitMap.set(ip, { count: 1, lastReset: now })
      } else {
        // Increment the request count
        record.count++
        
        if (record.count > MAX_REQUESTS_PER_WINDOW) {
          // Block the request, returning a 429 Too Many Requests status
          return new NextResponse(
            JSON.stringify({ 
              error: 'Too Many Requests', 
              message: 'Rate limit exceeded. Your IP address has been temporarily blocked.' 
            }),
            { 
              status: 429, 
              headers: { 
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((record.lastReset + RATE_LIMIT_WINDOW_MS - now) / 1000).toString()
              } 
            }
          )
        }
      }
    }
  }

  // Continue to the requested route
  const response = NextResponse.next()

  // CORS Configuration:
  // We intentionally omit broad "Access-Control-Allow-Origin: *" headers.
  // This allows the browser to enforce a stricter Same-Origin Policy (SOP), 
  // as recommended by security best practices (OWASP ZAP).
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
