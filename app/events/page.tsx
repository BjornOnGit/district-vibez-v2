"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin } from "lucide-react"

export default function EventsPage() {
  const events = useQuery(api.events.list)

  if (events === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">No events available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Upcoming Events</h1>
          <p className="text-muted-foreground">Discover and book tickets for the hottest parties</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event._id} href={`/events/${event._id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative h-48 w-full">
                  <Image
                    src={event.imageUrl || "/placeholder.svg?height=200&width=400"}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{event.name}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="text-lg font-bold">₦{event.ticketPrice.toLocaleString()}</p>
                    </div>
                    <Button>Get Tickets</Button>
                  </div>

                  {event.availableTickets < 50 && event.availableTickets > 0 && (
                    <p className="text-sm text-orange-600 mt-3">Only {event.availableTickets} tickets left!</p>
                  )}
                  {event.availableTickets === 0 && <p className="text-sm text-red-600 mt-3 font-semibold">Sold Out</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
