import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { calculateBookingEstimate } from "../utils/bookingCalculations";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

const todayStr = () => new Date().toISOString().split("T")[0];

const NewBooking = () => {
  const { lotId, slotId } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/parking-lots/${lotId}`);
        const foundSlot = res.data.slots.find((s) => s._id === slotId);
        if (!foundSlot || foundSlot.status !== "available") {
          setNotFound(true);
        } else {
          setLot(res.data.parkingLot);
          setSlot(foundSlot);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lotId, slotId]);

  const { entryDate, exitDate, durationHours, estimate, isValidRange } = calculateBookingEstimate(
    date,
    entryTime,
    exitTime,
    slot?.pricePerHour
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!entryTime || !exitTime) {
      toast.error("Please choose both an entry and exit time.");
      return;
    }
    if (!isValidRange) {
      toast.error("Exit time must be after entry time.");
      return;
    }
    if (entryDate < new Date()) {
      toast.error("Entry time can't be in the past.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        parkingLotId: lotId,
        slotId,
        entryTime: entryDate.toISOString(),
        exitTime: exitDate.toISOString(),
      });
      toast.success("Booking created! Complete payment to confirm your spot.");
      navigate(`/bookings?highlight=${res.data.booking._id}`);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 409) {
        toast.error(message || "This slot is already booked for that time. Try a different time.");
      } else {
        toast.error(message || "Couldn't create the booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <EmptyState
          icon={Calendar}
          title="This slot isn't available"
          description="It may have just been booked by someone else, or no longer exists."
          action={
            <Link to={`/parking/${lotId}`} className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              Back to parking lot
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to={`/parking/${lotId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to {lot.name}
      </Link>

      <h1 className="font-display text-2xl font-semibold mb-1">Book slot {slot.slotNumber}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {lot.name} · ₹{slot.pricePerHour}/hr · {slot.vehicleType}
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
              style={{ borderColor: "var(--color-border)" }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Entry time
              </label>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
                style={{ borderColor: "var(--color-border)" }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Exit time
              </label>
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
                style={{ borderColor: "var(--color-border)" }}
                required
              />
            </div>
          </div>

          {entryTime && exitTime && !isValidRange && (
            <p className="text-sm" style={{ color: "var(--color-occupied)" }}>
              Exit time must be after entry time.
            </p>
          )}

          {isValidRange && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{ background: "var(--color-bg)" }}
            >
              <span className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                {durationHours.toFixed(1)} hour{durationHours !== 1 ? "s" : ""}
              </span>
              <span className="font-display font-semibold text-lg flex items-center">
                <IndianRupee className="w-4 h-4" />
                {estimate}
              </span>
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full mt-2">
            Confirm booking
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default NewBooking;
