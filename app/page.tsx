import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { EventDetails } from "@/components/event-details"
import { Gallery } from "@/components/gallery"
import { Tickets } from "@/components/tickets"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <EventDetails />
      <Gallery />
      <Tickets />
      <Footer />
    </main>
  )
}
