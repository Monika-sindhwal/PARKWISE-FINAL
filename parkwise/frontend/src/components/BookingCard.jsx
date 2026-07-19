import { Link } from "react-router-dom";
import { MapPin, IndianRupee, QrCode } from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const BookingCard = ({ booking, onCancel, cancelling, onPay, paying, highlighted }) => {
  const canCancel = ["pending", "confirmed"].includes(booking.bookingStatus);
  const needsPayment = booking.bookingStatus === "pending" && booking.paymentStatus === "unpaid";
  const canShowQr = booking.bookingStatus === "confirmed";

  return (
    <Card
      className="p-5"
      style={highlighted ? { borderColor: "var(--color-primary)", borderWidth: 2 } : undefined}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-semibold">{booking.parkingLotId?.name || "Parking lot"}</h3>
          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
            <MapPin className="w-3 h-3" /> {booking.parkingLotId?.city}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={booking.bookingStatus} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>
        Slot {booking.slotId?.slotNumber} · {formatDateTime(booking.entryTime)} → {formatDateTime(booking.exitTime)}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold flex items-center">
          <IndianRupee className="w-3.5 h-3.5" />
          {booking.totalAmount}
        </span>
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              className="text-xs px-3 py-1.5"
              loading={cancelling}
              onClick={() => onCancel(booking._id)}
            >
              Cancel
            </Button>
          )}
          {needsPayment && (
            <Button
              variant="primary"
              className="text-xs px-3 py-1.5"
              loading={paying}
              onClick={() => onPay(booking)}
            >
              Pay now
            </Button>
          )}
          {canShowQr && (
            <Link to={`/bookings/${booking._id}/qr`}>
              <Button variant="dark" icon={QrCode} className="text-xs px-3 py-1.5">
                View QR
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BookingCard;
