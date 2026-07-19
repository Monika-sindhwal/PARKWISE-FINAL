import { Link } from "react-router-dom";
import { Search, CreditCard, QrCode, MapPin, ArrowRight, Building2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LiveSlotBoard from "../components/LiveSlotBoard";

const steps = [
  { number: "01", title: "Search", desc: "Find lots near your destination, or use your current location." },
  { number: "02", title: "Book", desc: "Pick a slot, your entry and exit time — pay securely in the app." },
  { number: "03", title: "Park", desc: "Show your QR code at the gate. No ticket machine, no guessing." },
];

const features = [
  { icon: MapPin, title: "Real-time availability", desc: "See exactly which slots are open before you drive over." },
  { icon: CreditCard, title: "Secure payment", desc: "Pay online via Razorpay — your booking is confirmed instantly." },
  { icon: QrCode, title: "QR entry", desc: "Your booking becomes a scannable pass. No paper, no waiting." },
];

const Landing = () => {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] font-semibold leading-tight">
            Stop circling
            <br />
            the block.
          </h1>
          <p className="mt-4 text-base sm:text-lg" style={{ color: "var(--color-ink-muted)" }}>
            ParkWise finds, books, and confirms your parking spot before you even
            arrive — with real-time availability, secure payment, and QR entry.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register">
              <Button variant="primary" icon={Search} className="text-base px-5 py-3">
                Find parking
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" icon={Building2} className="text-base px-5 py-3">
                List my lot
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <LiveSlotBoard />
        </div>
      </section>

      <div className="stripe-accent" />

      {/* How it works - a real 3-step sequence, so numbering is justified */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl font-semibold mb-8">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number}>
              <span
                className="font-display text-sm font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                {step.number}
              </span>
              <h3 className="font-semibold text-lg mt-2 mb-1">{step.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "var(--color-surface)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-semibold mb-8">Built for how you actually park</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "#EEF2FE" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Owner CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <Card className="p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold mb-1">
              Own a parking lot?
            </h2>
            <p className="text-sm sm:text-base" style={{ color: "var(--color-ink-muted)" }}>
              List your space, manage slots, and track revenue — all in one dashboard.
            </p>
          </div>
          <Link to="/register" className="shrink-0">
            <Button variant="primary" icon={ArrowRight} className="text-base px-5 py-3">
              Get started
            </Button>
          </Link>
        </Card>
      </section>

      <footer
        className="px-4 sm:px-6 py-8 text-sm text-center"
        style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-ink-muted)" }}
      >
        © {new Date().getFullYear()} ParkWise
      </footer>
    </div>
  );
};

export default Landing;
