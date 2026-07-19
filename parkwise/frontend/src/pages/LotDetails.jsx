import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Clock, ArrowLeft, Car, Bike, Truck, Zap } from "lucide-react";
import api from "../api/axios";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

const vehicleIcons = { car: Car, bike: Bike, truck: Truck, ev: Zap };

const LotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { parkingLot, slots, summary }
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchLot = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/parking-lots/${id}`);
        setData(res.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLot();
  }, [id]);

  const handleSlotClick = (slot) => {
    if (slot.status !== "available") return;
    navigate(`/book/${id}/${slot._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-32 w-full rounded-2xl mb-8" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <EmptyState
          icon={MapPin}
          title="Parking lot not found"
          description="It may have been removed, or the link is incorrect."
          action={
            <Link to="/search" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              Back to search
            </Link>
          }
        />
      </div>
    );
  }

  const { parkingLot, slots, summary } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <Card className="p-6 mb-8">
        <h1 className="font-display text-2xl font-semibold mb-2">{parkingLot.name}</h1>
        <div className="flex items-start gap-1.5 text-sm mb-1.5" style={{ color: "var(--color-ink-muted)" }}>
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {parkingLot.address}, {parkingLot.city}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--color-ink-muted)" }}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {parkingLot.openingTime} – {parkingLot.closingTime}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--color-bg)" }}>
            {summary.totalSlots} total slots
          </span>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(22,163,74,0.12)", color: "var(--color-available)" }}
          >
            {summary.available} available
          </span>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(220,38,38,0.12)", color: "var(--color-occupied)" }}
          >
            {summary.occupied} occupied
          </span>
        </div>
      </Card>

      <h2 className="font-display text-xl font-semibold mb-4">Slots</h2>

      {slots.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No slots added yet"
          description="This lot's owner hasn't added any slots yet — check back soon."
        />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {slots.map((slot) => {
            const Icon = vehicleIcons[slot.vehicleType] || Car;
            const isAvailable = slot.status === "available";
            const isMaintenance = slot.status === "maintenance";
            return (
              <button
                key={slot._id}
                onClick={() => handleSlotClick(slot)}
                disabled={!isAvailable}
                className="flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-all duration-150"
                style={{
                  borderColor: isAvailable
                    ? "var(--color-available)"
                    : isMaintenance
                    ? "var(--color-border)"
                    : "var(--color-occupied)",
                  background: isAvailable ? "rgba(22,163,74,0.06)" : isMaintenance ? "var(--color-bg)" : "rgba(220,38,38,0.06)",
                  cursor: isAvailable ? "pointer" : "not-allowed",
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{
                    color: isAvailable
                      ? "var(--color-available)"
                      : isMaintenance
                      ? "var(--color-ink-muted)"
                      : "var(--color-occupied)",
                  }}
                />
                <span className="text-xs font-semibold">{slot.slotNumber}</span>
                <span className="text-[10px]" style={{ color: "var(--color-ink-muted)" }}>
                  ₹{slot.pricePerHour}/hr
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LotDetails;
