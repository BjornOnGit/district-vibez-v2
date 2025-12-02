import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getReservationCount = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("reservations").collect()
    return docs.length
  },
})

export const createReservation = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    ticketId: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reservations", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      ticketId: args.ticketId ?? undefined,
      createdAt: Date.now(),
    })
    return id
  },
})
