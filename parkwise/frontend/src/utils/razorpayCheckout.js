// Loads Razorpay's checkout script once, reused across the session.
let scriptLoadingPromise = null;

export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

// Computes an HMAC-SHA256 hex signature using the browser's native Web Crypto API.
// Only ever used with the backend's known dev/test fallback secret ("test_secret") -
// this is NOT how real payments are verified. Real payments get their signature
// from Razorpay's own servers, which use the real (backend-only) secret key.
export const computeTestSignature = async (message, secret) => {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await window.crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// The backend's known placeholder when no real Razorpay keys are configured
// (see backend src/controllers/payment.controller.js)
export const MOCK_KEY_PLACEHOLDER = "mock_key_for_dev";
