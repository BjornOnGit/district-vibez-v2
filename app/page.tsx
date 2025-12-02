import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { EventDetails } from "@/components/event-details"
import { Gallery } from "@/components/gallery"
import { Tickets } from "@/components/tickets"
import { Footer } from "@/components/footer"
import FreeOfferBanner from "@/components/free-offer-banner"

export default function Home() {
  return (
    <main className="min-h-screen">
      <FreeOfferBanner />
      <Navbar />
      <Hero />
      <EventDetails />
      <Gallery />
      <Tickets />
      <Footer />
    </main>
  )
}
