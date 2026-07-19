import { Link } from "react-router-dom";
import { Search, Car, Building2, ShieldCheck, ArrowRight, ScanLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";

const customerActions = [
  { icon: Search, title: "Find parking nearby", desc: "Search by city or use your current location", to: "/search" },
  { icon: Car, title: "My bookings", desc: "View upcoming and past reservations", to: "/bookings" },
];

const ownerActions = [
  { icon: Building2, title: "My parking lots", desc: "Manage lots, floors, and slots", to: "/owner/lots" },
  { icon: Car, title: "Bookings", desc: "See who's booked your spaces", to: "/owner/bookings" },
  { icon: ScanLine, title: "Verify entry", desc: "Scan a customer's QR code at the gate", to: "/owner/verify" },
];

const adminActions = [
  { icon: ShieldCheck, title: "Approve lots", desc: "Review pending parking lot submissions", to: "/admin/lots" },
  { icon: Building2, title: "Platform overview", desc: "Users, lots, bookings, and revenue", to: "/admin/dashboard" },
];

const actionsByRole = {
  customer: customerActions,
  owner: ownerActions,
  admin: adminActions,
};

const Home = () => {
  const { user } = useAuth();
  const actions = actionsByRole[user?.role] || customerActions;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1">
        Welcome, {user?.name?.split(" ")[0]}
      </h1>
      <p className="text-sm sm:text-base mb-8" style={{ color: "var(--color-ink-muted)" }}>
        {user?.role === "customer" && "Where would you like to park today?"}
        {user?.role === "owner" && "Here's what's happening with your parking lots."}
        {user?.role === "admin" && "Here's what's happening across the platform."}
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {actions.map(({ icon: Icon, title, desc, to }) => (
          <Link key={to} to={to}>
            <Card hoverable className="p-6 h-full flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#EEF2FE" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-0.5">{title}</h3>
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  {desc}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 mt-1 shrink-0" style={{ color: "var(--color-ink-muted)" }} />
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs mt-8" style={{ color: "var(--color-ink-muted)" }}>
        More of these pages are coming in the next build — this is Module 1: Auth. 🚧
      </p>
    </div>
  );
};

export default Home;
