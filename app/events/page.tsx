"use client"

import { useConvex } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Calendar, MapPin, Ticket } from "lucide-react"

type TicketType = {
  type: string
  price?: number
  price_cents?: number
  currency?: string
  perks?: string[]
}

type Event = {
  _id: string
  name: string
  description?: string
  venue?: string
  date?: string
  imageUrl?: string
  ticketPricing?: TicketType[]
  status: "active" | "sold_out" | "cancelled"
}

export default function HomePage() {
  const convex = useConvex()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const activeEvents = await convex.query("events:list" as any)
        setEvents(activeEvents || [])
      } catch (err) {
        console.error("[v0] Error loading events:", err)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [convex])

  const handleBuyTicket = (eventId: string, ticketType: string) => {
    router.push(`/events/${eventId}/checkout?ticketType=${ticketType}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Event Ticketing</h1>
            <Button variant="outline" onClick={() => router.push("/admin/events")} className="hidden md:inline-flex">
              Admin
            </Button>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-2">Upcoming Events</h2>
          <p className="text-lg text-muted-foreground">Choose your preferred ticket type and secure your spot</p>
        </div>

        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No events available at this time</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => (
              <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image */}
                {event.imageUrl ? (
                  <div className="w-full h-48 bg-muted overflow-hidden">
                    <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                ) : null}

                <div className="p-6 space-y-4">
                  {/* Event Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{event.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  </div>

                  {/* Event Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{event.venue}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button onClick={() => router.push(`/events/${event._id}`)} className="w-full mt-2">
                      See details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-6xl mx-auto px-8 py-8 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Event Ticketing Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
