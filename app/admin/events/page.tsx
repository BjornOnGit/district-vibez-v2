"use client"

import { useConvex } from "convex/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Edit2, Trash2 } from "lucide-react"

type Event = {
  _id: string
  _creationTime: number
  name: string
  description: string
  venue: string
  date: string
  ticketPrice: number
  totalTickets: number
  availableTickets: number
  imageUrl?: string
  status: "active" | "sold_out" | "cancelled"
}

export default function AdminEventsPage() {
  const convex = useConvex()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "sold_out" | "cancelled">("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const args = filter === "all" ? {} : { status: filter }
        const data = await convex.query("events:listAll" as any, args)
        setEvents(data as Event[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [convex, filter])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      setDeleting(id)
      await convex.mutation("events:deleteEvent" as any, { id })
      setEvents(events.filter((e) => e._id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
    } finally {
      setDeleting(null)
    }
  }

  const statusColor = {
    active: "bg-green-100 text-green-800",
    sold_out: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Manage your events and ticket pricing</p>
          </div>
          <Link href="/admin/events/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "sold_out", "cancelled"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No events found. Create one to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event._id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-foreground">{event.name}</h2>
                      <Badge className={statusColor[event.status]}>{event.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Venue</p>
                        <p className="font-medium text-foreground">{event.venue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">{format(new Date(event.date), "MMM dd, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium text-foreground">₦{event.ticketPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available Tickets</p>
                        <p className="font-medium text-foreground">
                          {event.availableTickets}/{event.totalTickets}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/events/${event._id}`}>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(event._id)}
                      disabled={deleting === event._id}
                      className="gap-2"
                    >
                      {deleting === event._id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
