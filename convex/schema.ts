import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.string(),
    date: v.string(), // ISO 8601 format
    venue: v.string(),
    ticketPrice: v.number(),
    totalTickets: v.number(),
    availableTickets: v.number(),
    imageUrl: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("sold_out"), v.literal("cancelled")),
  }).index("by_date", ["date"]),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  }).index("by_email", ["email"]),

  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    paymentId: v.id("payments"),
    ticketCode: v.string(), // Unique QR code identifier
    qrCodeUrl: v.string(),
    pdfUrl: v.optional(v.string()),
    status: v.union(v.literal("valid"), v.literal("used"), v.literal("cancelled")),
    scannedAt: v.optional(v.number()), // Timestamp
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_ticket_code", ["ticketCode"])
    .index("by_payment", ["paymentId"]),

  payments: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(), // "NGN"
    provider: v.union(v.literal("paystack"), v.literal("zendapt")),
    providerReference: v.string(), // Paystack reference or ZendApt transaction ID
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    metadata: v.optional(v.any()), // Store provider-specific data
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_provider_reference", ["providerReference"])
    .index("by_status", ["status"]),

  webhook_events: defineTable({
    provider: v.union(v.literal("paystack"), v.literal("zendapt")),
    eventType: v.string(),
    payload: v.any(),
    signature: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_provider", ["provider"])
    .index("by_processed", ["processed"]),

  audit_logs: defineTable({
    action: v.string(), // "ticket_generated", "payment_completed", "ticket_scanned", etc.
    entityType: v.string(), // "ticket", "payment", "event"
    entityId: v.string(),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),
})
