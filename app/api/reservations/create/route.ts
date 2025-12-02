import type { NextRequest } from "next/server"
import { ConvexHttpClient } from "convex/browser"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch((e) => {
      console.error('[v0] reservations/create: invalid JSON', e)
      return null
    })
    if (!body) return Response.json({ error: 'Invalid JSON' }, { status: 400 })

    const { name, email, phone } = body
    if (!email || !name) return Response.json({ error: 'Missing name or email' }, { status: 400 })

    const { ConvexHttpClient } = await import('convex/browser')
    const apiModule = await import('@/convex/_generated/api')
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

    // Check count
    const count = await convex.query(apiModule.api.reservations.getReservationCount, {})
    const MAX_FREE = 50
    if (typeof count === 'number' && count >= MAX_FREE) {
      return Response.json({ full: true }, { status: 409 })
    }

    // Ensure user exists
    const userId = await convex.mutation(apiModule.api.users.createOrGetUser, { email, name, phone })

    // Generate a free ticket for the user
    const ticket = await convex.mutation(apiModule.api.tickets.generateTicket, {
      userId,
      ticketType: 'free',
    })

    // Persist reservation record linking to ticket
    await convex.mutation(apiModule.api.reservations.createReservation, {
      email,
      name,
      phone,
      ticketId: ticket.ticketId,
    })

    // Send ticket email (server-side)
    try {
      const { sendTicketEmail } = await import('@/lib/send-ticket-email')
      // Pick an event for context if available
      const events = await convex.query(apiModule.api.events.list, {})
      const event = Array.isArray(events) && events.length > 0 ? events[0] : null

      await sendTicketEmail({
        email,
        name,
        eventName: event?.name ?? 'District Vibez',
        eventDate: event?.date ?? new Date().toISOString(),
        eventVenue: event?.venue ?? 'TBA',
        ticketCode: ticket.ticketCode,
        qrCodeUrl: ticket.qrCodeUrl,
        ticketId: ticket.ticketId,
      })
    } catch (err) {
      console.error('[v0] reservations/create: failed to send email', err)
      // Non-fatal: continue and return success so user flow is smooth
    }

    return Response.json({ success: true, ticketId: ticket.ticketId })
  } catch (err) {
    console.error('[v0] reservations/create error', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
