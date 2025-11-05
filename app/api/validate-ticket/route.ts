import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json()

    if (!qrData || typeof qrData !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid QR data", error: "QR data is required" },
        { status: 400 },
      )
    }

    console.log("[v0] Validating ticket with qrData:", qrData)
    console.log("[v0] Attempting query with:", { code: qrData.trim() })

    const ticket = await fetchQuery(
      api.tickets.getTicketByCode,
      {
        ticketCode: qrData.trim()
      },
    )
    console.log("[v0] Ticket query response:", ticket)

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found", error: "No ticket found with this code" },
        { status: 404 },
      )
    }

    // Check if ticket is already used
    if ((ticket.status as string) === "used") {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket already used",
          ticket: {
            id: ticket._id,
            code: ticket.ticketCode,
            event_id: ticket.eventId,
            payment_id: ticket.paymentId,
            user_id: ticket.userId,
            qrCodeUrl: ticket.qrCodeUrl,
            status: ticket.status,
            created_at: new Date(ticket._creationTime).toISOString(),
          },
          error: "This ticket has already been used",
        },
        { status: 400 },
      )
    }

    // Check if ticket is paid
    if ((ticket.status as string) !== "valid") {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not valid",
          ticket: {
            id: ticket._id,
            code: ticket.ticketCode,
            event_id: ticket.eventId,
            payment_id: ticket.paymentId,
            user_id: ticket.userId,
            qrCodeUrl: ticket.qrCodeUrl,
            status: ticket.status,
            created_at: new Date(ticket._creationTime).toISOString(),
          },
          error: "Ticket must be paid before validation",
        },
        { status: 400 },
      )
    }

    await convex.mutation(
      api.tickets.markTicketAsUsed,
      {
        ticketId: ticket._id,
      },
    )

    return NextResponse.json({
      success: true,
      message: "Ticket validated successfully",
      ticket: {
            id: ticket._id,
            code: ticket.ticketCode,
            event_id: ticket.eventId,
            payment_id: ticket.paymentId,
            user_id: ticket.userId,
            qrCodeUrl: ticket.qrCodeUrl,
            status: ticket.status,
            created_at: new Date(ticket._creationTime).toISOString(),
          },
    })
  } catch (error) {
    console.error("[v0] Validation error details:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
