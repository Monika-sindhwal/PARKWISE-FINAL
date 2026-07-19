import { useState, useCallback } from "react";
import { ScanLine, User, Car, MapPin, CheckCircle2, Camera, Keyboard } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import QrCameraScanner from "../components/QrCameraScanner";

const VerifyQr = () => {
  const [mode, setMode] = useState("camera"); // "camera" | "manual"
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const verifyToken = useCallback(async (qrToken) => {
    if (!qrToken?.trim()) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await api.post("/bookings/verify-qr", { qrToken: qrToken.trim() });
      setResult(res.data);
      toast.success(res.data.alreadyCheckedIn ? "Already checked in" : "Entry verified!");
      setToken("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't verify this QR code.");
    } finally {
      setVerifying(false);
    }
  }, []);

  const handleCameraScan = useCallback(
    (data) => {
      if (verifying) return; // avoid re-triggering while a scan is already processing
      verifyToken(data);
    },
    [verifying, verifyToken]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyToken(token);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-semibold mb-1">Verify entry</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Scan a customer's QR code to check them in.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("camera")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border-2 transition-all"
          style={{
            borderColor: mode === "camera" ? "var(--color-primary)" : "var(--color-border)",
            background: mode === "camera" ? "#EEF2FE" : "transparent",
            color: mode === "camera" ? "var(--color-primary)" : "var(--color-ink-muted)",
          }}
        >
          <Camera className="w-4 h-4" /> Camera
        </button>
        <button
          onClick={() => setMode("manual")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border-2 transition-all"
          style={{
            borderColor: mode === "manual" ? "var(--color-primary)" : "var(--color-border)",
            background: mode === "manual" ? "#EEF2FE" : "transparent",
            color: mode === "manual" ? "var(--color-primary)" : "var(--color-ink-muted)",
          }}
        >
          <Keyboard className="w-4 h-4" /> Paste token
        </button>
      </div>

      {mode === "camera" && (
        <Card className="p-3 mb-6">
          <QrCameraScanner active={mode === "camera"} onScan={handleCameraScan} />
          <p className="text-xs text-center mt-3" style={{ color: "var(--color-ink-muted)" }}>
            Point the camera at the customer's QR code. Requires HTTPS or localhost and camera
            permission.
          </p>
        </Card>
      )}

      {mode === "manual" && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">QR token</label>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={3}
                placeholder="Paste the scanned token here..."
                className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm font-mono resize-none"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <Button type="submit" icon={ScanLine} loading={verifying} className="w-full">
              Verify entry
            </Button>
          </form>
        </Card>
      )}

      {result && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: result.alreadyCheckedIn ? "var(--color-accent)" : "var(--color-available)" }}
            />
            <span className="font-semibold">
              {result.alreadyCheckedIn ? "Already checked in" : "Entry verified"}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: "var(--color-ink-muted)" }} />
              <span>{result.booking.userId?.name}</span>
              <span style={{ color: "var(--color-ink-muted)" }}>· {result.booking.userId?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" style={{ color: "var(--color-ink-muted)" }} />
              <span>
                Slot {result.booking.slotId?.slotNumber} · {result.booking.slotId?.vehicleType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: "var(--color-ink-muted)" }} />
              <span>{result.booking.parkingLotId?.name}</span>
            </div>
          </div>

          {result.booking.checkInTime && (
            <p className="text-xs mt-4" style={{ color: "var(--color-ink-muted)" }}>
              Checked in at {new Date(result.booking.checkInTime).toLocaleString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export default VerifyQr;
