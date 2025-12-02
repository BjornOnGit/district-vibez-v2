import type { NextRequest } from "next/server"

export async function GET(_request: NextRequest) {
  try {
    const { ConvexHttpClient } = await import("convex/browser")
    const apiModule = await import("@/convex/_generated/api")
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    const count = await convex.query(apiModule.api.reservations.getReservationCount, {})
    return Response.json({ count })
  } catch (err) {
    console.error('[v0] reservations/count error', err)
    return Response.json({ error: 'Failed to get reservation count' }, { status: 500 })
  }
}
