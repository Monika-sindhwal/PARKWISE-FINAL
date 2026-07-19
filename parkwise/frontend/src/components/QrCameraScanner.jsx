import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import QrScannerWorkerPath from "qr-scanner/qr-scanner-worker.min.js?url";
import { CameraOff, AlertCircle } from "lucide-react";

QrScanner.WORKER_PATH = QrScannerWorkerPath;

// Camera-based QR scanner. Requires HTTPS or localhost (browsers block camera
// access on plain HTTP for any other host) and a device with a camera.
const QrCameraScanner = ({ onScan, active }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    setStarting(true);
    setError(null);

    const start = async () => {
      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          if (!cancelled) {
            setError("No camera found on this device.");
            setStarting(false);
          }
          return;
        }

        const scanner = new QrScanner(
          videoRef.current,
          (result) => onScan(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment", // rear camera on phones
          }
        );
        scannerRef.current = scanner;
        await scanner.start();
        if (!cancelled) setStarting(false);
      } catch (err) {
        if (!cancelled) {
          const message =
            err?.name === "NotAllowedError"
              ? "Camera access denied. Please allow camera permission and try again."
              : "Couldn't start the camera. Try pasting the token manually instead.";
          setError(message);
          setStarting(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [active, onScan]);

  if (!active) return null;

  return (
    <div className="rounded-xl overflow-hidden relative" style={{ background: "var(--color-ink)" }}>
      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
          <AlertCircle className="w-6 h-6 text-white/70" />
          <p className="text-sm text-white/70">{error}</p>
        </div>
      ) : (
        <>
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <p className="text-sm text-white/70 flex items-center gap-2">
                <CameraOff className="w-4 h-4 animate-pulse" /> Starting camera...
              </p>
            </div>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
        </>
      )}
    </div>
  );
};

export default QrCameraScanner;
