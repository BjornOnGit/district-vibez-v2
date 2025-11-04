"use client"

import EventForm from "@/components/admin/event-form"
import { useParams } from "next/navigation"

export default function EditEventPage() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Edit Event</h1>
        <p className="text-muted-foreground mb-8">Update event details and ticket pricing</p>
        <EventForm eventId={eventId} isEditing={true} />
      </div>
    </div>
  )
}
