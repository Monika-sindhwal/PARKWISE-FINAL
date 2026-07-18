const Razorpay = require("razorpay");

let cachedInstance;

// Returns a Razorpay client. If real API keys aren't configured (or we're
// running tests), returns a mock with the same shape instead - so
// `npm test` never makes a real network call to Razorpay's servers, and
// local development works before you've signed up for a Razorpay account.
const getRazorpayInstance = () => {
  if (cachedInstance) return cachedInstance;

  const hasRealKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

  if (process.env.NODE_ENV === "test" || !hasRealKeys) {
    cachedInstance = {
      orders: {
        create: async (options) => ({
          id: `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          amount: options.amount,
          currency: options.currency,
          status: "created",
        }),
      },
    };
    return cachedInstance;
  }

  cachedInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return cachedInstance;
};

module.exports = getRazorpayInstance;
