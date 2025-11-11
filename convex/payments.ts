import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createPayment = mutation({
  args: {
    eventId: v.id("events"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    quantity: v.number(),
    paymentMethod: v.union(v.literal("paystack"), v.literal("zendapt")),
    ticketType: v.optional(v.string()),
    ticketPrice: v.optional(v.number()),
  },
  async handler(ctx, args) {
    // Find or create user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    const userId =
      existingUser?._id ||
      (await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        phone: args.phone,
      }))

    // Get event to calculate total amount
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")

  // Determine unit price: prefer provided ticketPrice (from checkout) else event value
  const unitPrice = args.ticketPrice ?? event.ticketPrice
  const totalAmount = unitPrice * args.quantity

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      eventId: args.eventId,
      userId: userId,
      amount: totalAmount,
      currency: "NGN",
      provider: args.paymentMethod,
      providerReference: "", // Will be filled after payment gateway response
      status: "pending",
      metadata: {
        quantity: args.quantity,
        userEmail: args.email,
        userName: args.name,
        ticketType: args.ticketType,
        unitPrice,
      },
    })

    return {
      paymentId,
      userId,
      totalAmount,
      quantity: args.quantity,
    }
  },
})

export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.optional(v.id("payments")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    providerReference: v.optional(v.string()),
  },
  async handler(ctx, args) {
    // Allow updating by either internal paymentId or providerReference (fallback).
    if (args.paymentId) {
      await ctx.db.patch(args.paymentId, {
        status: args.status,
        ...(args.providerReference ? { providerReference: args.providerReference } : {}),
      })
      return
    }

    if (args.providerReference) {
      const found = await ctx.db
        .query("payments")
        .withIndex("by_provider_reference", (q) => q.eq("providerReference", args.providerReference!))
        .first()
      if (found?._id) {
        await ctx.db.patch(found._id, {
          status: args.status,
          providerReference: args.providerReference,
        })
        return
      }
    }

    // If neither identifier is provided, log and return silently to allow downstream
    // processes (like ticket generation) to continue without blocking.
    console.warn("[v0] updatePaymentStatus called without paymentId or providerReference; skipping update")
    return
  },
})

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  async handler(ctx, args) {
    return await ctx.db.get(args.paymentId)
  },
})

export const getPaymentByProviderReference = query({
  args: { providerReference: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("payments")
      .withIndex("by_provider_reference", (q) => q.eq("providerReference", args.providerReference!))
      .first()
  },
})
