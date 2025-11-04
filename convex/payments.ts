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

    const totalAmount = event.ticketPrice * args.quantity

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
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    providerReference: v.string(),
  },
  async handler(ctx, args) {
    await ctx.db.patch(args.paymentId, {
      status: args.status,
      providerReference: args.providerReference,
    })
  },
})

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  async handler(ctx, args) {
    return await ctx.db.get(args.paymentId)
  },
})
