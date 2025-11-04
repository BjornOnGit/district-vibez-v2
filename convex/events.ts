import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect()

    return events
  },
})

export const getById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    return event
  },
})

export const listAll = query({
  args: { status: v.optional(v.union(v.literal("active"), v.literal("sold_out"), v.literal("cancelled"))) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("events")
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status))
    }
    return await q.order("desc").collect()
  },
})

export const getEvent = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    date: v.string(),
    venue: v.string(),
    ticketPrice: v.number(),
    totalTickets: v.number(),
    availableTickets: v.number(),
    status: v.union(v.literal("active"), v.literal("sold_out"), v.literal("cancelled")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      date: args.date,
      venue: args.venue,
      ticketPrice: args.ticketPrice,
      totalTickets: args.totalTickets,
      availableTickets: args.availableTickets,
      status: args.status,
      imageUrl: args.imageUrl,
    })

    return await ctx.db.get(eventId)
  },
})

export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    venue: v.optional(v.string()),
    ticketPrice: v.optional(v.number()),
    totalTickets: v.optional(v.number()),
    availableTickets: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("sold_out"), v.literal("cancelled"))),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
    return await ctx.db.get(id)
  },
})

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return { success: true }
  },
})
