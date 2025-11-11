"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Calendar, MapPin, Ticket } from "lucide-react"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const event = useQuery(api.events.getById, { eventId: eventId as any })

  if (event === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Event not found</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.date)
  const isSoldOut = event.availableTickets === 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/events" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Image */}
          <div className="lg:col-span-2">
            <div className="relative h-96 w-full rounded-lg overflow-hidden mb-6">
              <Image
                src={event.imageUrl || "/placeholder.svg?height=400&width=600"}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Event Details */}
            <Card className="p-6">
              <h1 className="text-4xl font-bold mb-4">{event.name}</h1>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="text-lg font-semibold">
                      {eventDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="text-lg font-semibold">{event.venue}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            </Card>
          </div>

          {/* Booking Card */}
          <div>
            <Card className="p-6 sticky top-8">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Ticket Options</p>
                {event.ticketPricing && event.ticketPricing.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {event.ticketPricing.map((tp: any) => {
                      const priceNumber = tp.price ?? (tp.price_cents ? tp.price_cents / 100 : event.ticketPrice)
                      return (
                        <div
                          key={tp.type}
                          className="flex items-center justify-between border border-input rounded-lg p-3"
                        >
                          <div>
                            <div className="font-semibold capitalize">{tp.type} Ticket</div>
                            <div className="text-lg font-bold text-primary">₦{priceNumber.toLocaleString()}</div>
                          </div>

                          <Link href={`/checkout/${event._id}?ticketType=${encodeURIComponent(tp.type)}`}>
                            <Button size="sm">Buy</Button>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-4xl font-bold">₦{event.ticketPrice.toLocaleString()}</p>
                )}
              </div>

              {/* <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="h-5 w-5" />
                  <span className="font-semibold">Availability</span>
                </div>
                <p className="text-2xl font-bold">
                  {event.availableTickets} / {event.totalTickets}
                </p>
                <p className="text-sm text-muted-foreground">tickets available</p>
              </div> */}

              {/* {isSoldOut ? (
                <Button disabled className="w-full" size="lg">
                  Sold Out
                </Button>
              ) : (
                <Link href={`/checkout/${event._id}`}>
                  <Button className="w-full" size="lg">
                    Get Tickets
                  </Button>
                </Link>
              )} */}

              {event.availableTickets < 50 && event.availableTickets > 0 && (
                <p className="text-sm text-orange-600 mt-4 text-center font-semibold">
                  Only {event.availableTickets} tickets left!
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
