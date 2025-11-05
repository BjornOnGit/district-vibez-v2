import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const generateTicket = mutation({
  args: {
    paymentId: v.id("payments"),
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    // Generate unique ticket code
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create QR code data URL (will be generated on client side for now)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketCode)}`

    // Create ticket record
    const ticketId = await ctx.db.insert("tickets", {
      eventId: args.eventId,
      userId: args.userId,
      paymentId: args.paymentId,
      ticketCode,
      qrCodeUrl,
      status: "valid",
    })

    // Update event available tickets
    const event = await ctx.db.get(args.eventId)
    if (event) {
      await ctx.db.patch(args.eventId, {
        availableTickets: Math.max(0, event.availableTickets - 1),
      })
    }

    // Log audit event
    await ctx.db.insert("audit_logs", {
      action: "ticket_generated",
      entityType: "ticket",
      entityId: ticketId,
      userId: args.userId,
      timestamp: Date.now(),
    })

    return { ticketId, ticketCode, qrCodeUrl }
  },
})

export const getTicketByCode = query({
  args: { ticketCode: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticket_code", (q) => q.eq("ticketCode", args.ticketCode))
      .first()
  },
})

export const getUserTickets = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    return await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})


export const markTicketAsUsed = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  async handler(ctx, args) {
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) throw new Error("Ticket not found")

    if (ticket.status === "used") {
      throw new Error("Ticket already marked as used")
    }

    await ctx.db.patch(args.ticketId, {
      status: "used",
      scannedAt: Date.now(),
    })

    await ctx.db.insert("audit_logs", {
      action: "ticket_scanned",
      entityType: "ticket",
      entityId: args.ticketId,
      userId: ticket.userId,
      timestamp: Date.now(),
    })

    return { success: true, message: "Ticket marked as used" }
  },
})