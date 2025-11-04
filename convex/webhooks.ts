import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const storeWebhookEvent = mutation({
  args: {
    provider: v.union(v.literal("paystack"), v.literal("zendapt")),
    eventType: v.string(),
    payload: v.any(),
    signature: v.string(),
  },
  async handler(ctx, args) {
    await ctx.db.insert("webhook_events", {
      provider: args.provider,
      eventType: args.eventType,
      payload: args.payload,
      signature: args.signature,
      processed: false,
    })
  },
})
