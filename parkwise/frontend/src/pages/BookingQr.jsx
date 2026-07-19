import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, QrCode, AlertCircle, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

const BookingQr = () => {
  const { id } = useParams();
  const [qrImage, setQrImage] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await api.get(`/bookings/${id}/qr`);
        setQrImage(res.data.qrImage);
        setQrToken(res.data.qrToken);
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message || "Couldn't load your QR code. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, [id]);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      toast.success("Token copied - paste it into the owner's Verify Entry screen.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically. Try selecting the text manually.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to my bookings
      </Link>

      <h1 className="font-display text-2xl font-semibold mb-1">Your entry pass</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Show this QR code at the parking entrance.
      </p>

      {loading && (
        <Card className="p-8 flex flex-col items-center">
          <Skeleton className="w-56 h-56 rounded-lg" />
        </Card>
      )}

      {!loading && errorMessage && (
        <Card className="p-6">
          <EmptyState
            icon={AlertCircle}
            title="QR code not available"
            description={errorMessage}
          />
        </Card>
      )}

      {!loading && qrImage && (
        <Card className="p-8 flex flex-col items-center">
          <img src={qrImage} alt="Booking QR code" className="w-56 h-56" />
          <div
            className="flex items-center gap-1.5 text-xs mt-4 mb-4"
            style={{ color: "var(--color-ink-muted)" }}
          >
            <QrCode className="w-3.5 h-3.5" />
            Valid for this booking only
          </div>
          <Button
            variant="outline"
            icon={copied ? Check : Copy}
            onClick={handleCopyToken}
            className="text-sm"
          >
            {copied ? "Copied!" : "Copy token (for testing on one device)"}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default BookingQr;
