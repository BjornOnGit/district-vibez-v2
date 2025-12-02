import { Button } from "@/components/ui/button"

export function Tickets() {
  const tickets = [
    {
      name: "Regular",
      price: "₦5,000",
      featured: false,
      features: ["Event Entry", "Basic Refreshments", "Photo Booth Access", "Live DJ Performance"],
    },
    {
      name: "VIP",
      price: "₦20,000",
      featured: true,
      features: [
        "Premium Entry",
        "Premium Bar Access",
        "VIP Lounge",
        "Priority Photo Booth",
        "Exclusive DJ Set",
        "Premium Seating",
      ],
    },
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 uppercase">Let's Be Your Hosts</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {tickets.map((ticket) => (
            <div
              key={ticket.name}
              className={`border rounded-lg p-8 flex flex-col ${
                ticket.featured ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <h3 className="text-xl font-bold mb-4">{ticket.name} Ticket</h3>
              <p className="text-3xl font-bold mb-8">{ticket.price}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {ticket.features.map((feature, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full">Get Ticket</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
