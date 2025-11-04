import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendTicketEmailProps {
  email: string
  name: string
  eventName: string
  eventDate: string
  eventVenue: string
  ticketCode: string
  qrCodeUrl: string
  ticketId: string
}

export async function sendTicketEmail({
  email,
  name,
  eventName,
  eventDate,
  eventVenue,
  ticketCode,
  qrCodeUrl,
  ticketId,
}: SendTicketEmailProps) {
  try {
    console.log("[v0] Sending ticket email to:", email)

    const result = await resend.emails.send({
      from: "ticketing@districtvibez.com",
      to: email,
      subject: `Your Ticket for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
              .ticket-details { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #000; }
              .qr-code { text-align: center; margin: 20px 0; }
              .qr-code img { max-width: 300px; height: auto; }
              .ticket-code { font-size: 18px; font-weight: bold; font-family: monospace; text-align: center; padding: 10px; background: #f0f0f0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Your Event Ticket</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for your purchase! Your ticket for <strong>${eventName}</strong> is ready.</p>
                
                <div class="ticket-details">
                  <h3>Event Details</h3>
                  <p><strong>Event:</strong> ${eventName}</p>
                  <p><strong>Date:</strong> ${eventDate}</p>
                  <p><strong>Venue:</strong> ${eventVenue}</p>
                </div>

                <div class="ticket-details">
                  <h3>Your Ticket</h3>
                  <p><strong>Ticket ID:</strong> ${ticketId}</p>
                  <div class="ticket-code">${ticketCode}</div>
                </div>

                <div class="qr-code">
                  <p><strong>Scan this QR code at the event:</strong></p>
                  <img src="${qrCodeUrl}" alt="Ticket QR Code" />
                </div>

                <p>Please save this email or take a screenshot of the QR code. You'll need to present it at the event entrance.</p>
                
                <div class="footer">
                  <p>If you have any questions, please contact our support team.</p>
                  <p>&copy; 2025 Ticketing Platform. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] Email sent successfully:", result)
    return result
  } catch (error) {
    console.error("[v0] Failed to send email:", error)
    throw error
  }
}
