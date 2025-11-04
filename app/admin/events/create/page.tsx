import EventForm from "@/components/admin/event-form"

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Event</h1>
        <p className="text-muted-foreground mb-8">Add a new event to your platform</p>
        <EventForm />
      </div>
    </div>
  )
}
