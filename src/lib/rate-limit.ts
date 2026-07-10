import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback to a dummy limiter if UPSTASH_REDIS_REST_URL is missing 
// so the app doesn't crash during local dev without env vars.
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

export const rateLimiter = {
  reservations: hasRedis
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 reservations per hour per IP
        analytics: true,
      })
    : null,

  analytics: hasRedis
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 tracking events per minute per IP
        analytics: true,
      })
    : null,

  orders: hasRedis
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 self-placed orders per hour per IP
        analytics: true,
      })
    : null,
}

// Extract IP address from Next.js Request (works with Cloudflare Pages)
export function getIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}
