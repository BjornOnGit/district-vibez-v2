import { mutation } from "./_generated/server"

export const seedEvents = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if events already exist
    const existingEvents = await ctx.db.query("events").collect()
    if (existingEvents.length > 0) {
      return { message: "Events already seeded", count: existingEvents.length }
    }

    // Event 1: Pool Party
    const event1 = await ctx.db.insert("events", {
      name: "Summer Pool Party 2024",
      description: "The hottest pool party of the summer! DJ, drinks, and good vibes.",
      date: new Date("2024-08-15T18:00:00Z").toISOString(),
      venue: "Aqua Lounge, Lagos",
      imageUrl: "/pool-party.jpg",
      ticketPrice: 5000,
      totalTickets: 180,
      availableTickets: 180,
      status: "active",
        })
    
        // Event 2: Rooftop Concert
        const event2 = await ctx.db.insert("events", {
          name: "Afrobeats Rooftop Concert",
          description: "Live performances from top Afrobeats artists under the stars.",
          date: new Date("2024-09-01T20:00:00Z").toISOString(),
          venue: "Sky Terrace, Victoria Island",
          imageUrl: "/rooftop-concert.jpg",
          ticketPrice: 10000,
          totalTickets: 220,
          availableTickets: 220,
          status: "active",
        });
    
        return { message: "Events seeded", count: 2 }
      }
    })
