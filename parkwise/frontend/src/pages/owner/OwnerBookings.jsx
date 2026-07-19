import { useEffect, useState } from "react";
import { Calendar, User, MapPin, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const OwnerBookings = () => {
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/bookings/owner");
        setBookings(res.data.bookings);
      } catch {
        toast.error("Couldn't load bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-7 w-48 mb-8" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-8">Bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No bookings yet" description="Bookings on your lots will show up here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b._id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="w-3.5 h-3.5" style={{ color: "var(--color-ink-muted)" }} />
                    {b.userId?.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                    <MapPin className="w-3 h-3" /> {b.parkingLotId?.name} · Slot {b.slotId?.slotNumber}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={b.bookingStatus} />
                  <StatusBadge status={b.paymentStatus} />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--color-ink-muted)" }}>
                  {formatDateTime(b.entryTime)} → {formatDateTime(b.exitTime)}
                </span>
                <span className="font-display font-semibold flex items-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {b.totalAmount}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
