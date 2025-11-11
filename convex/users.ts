import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const createOrGetUser = mutation({
  args: { email: v.optional(v.string()), name: v.optional(v.string()), phone: v.optional(v.string()) },
  async handler(ctx, args) {
    // If email provided, try to find existing user
    if (args.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first()

      if (existingUser?._id) return existingUser._id
    }

    // Create a fallback user when email/name missing
    const email = args.email ?? `guest-${Date.now()}@no-reply.local`
    const name = args.name ?? "Guest"

    const userId = await ctx.db.insert("users", {
      email,
      name,
      phone: args.phone,
    })
    return userId
  },
})
