import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Calendar, IndianRupee, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { loadRazorpayScript, computeTestSignature, MOCK_KEY_PLACEHOLDER } from "../utils/razorpayCheckout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Card from "../components/ui/Card";
import BookingCard from "../components/BookingCard";

const Bookings = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/customer");
      setData(res.data);
    } catch {
      toast.error("Couldn't load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled.");
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't cancel this booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const verifyAndFinish = async (verifyPayload) => {
    try {
      await api.post("/payments/verify", verifyPayload);
      toast.success("Payment successful! Your booking is confirmed.");
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment verification failed.");
    } finally {
      setPayingId(null);
    }
  };

  const handlePay = async (booking) => {
    setPayingId(booking._id);
    try {
      const orderRes = await api.post("/payments/create-order", { bookingId: booking._id });
      const { razorpayOrder, razorpayKeyId } = orderRes.data;

      // No real Razorpay keys configured on the backend yet - fall back to a
      // clearly-labeled dev test payment instead of a real checkout widget
      // (a real widget can't open without a genuine key). This exercises the
      // exact same /verify endpoint and signature check real payments use.
      if (razorpayKeyId === MOCK_KEY_PLACEHOLDER) {
        toast("Test mode: simulating payment (no real Razorpay keys set)", { icon: "🧪" });
        const fakePaymentId = `pay_test_${Date.now()}`;
        const signature = await computeTestSignature(
          `${razorpayOrder.id}|${fakePaymentId}`,
          "test_secret"
        );
        await verifyAndFinish({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: signature,
        });
        return;
      }

      // Real Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Couldn't load the payment gateway. Check your connection.");
        setPayingId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "ParkWise",
        description: `Booking ${booking._id}`,
        theme: { color: "#2C4BDB" },
        handler: async (response) => {
          await verifyAndFinish({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => setPayingId(null),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't start payment.");
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-7 w-48 mb-8" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl mb-4" />
        ))}
      </div>
    );
  }

  const { upcomingBookings, bookingHistory, totalSpent } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">My bookings</h1>
        <Card className="px-4 py-2.5 flex items-center gap-2">
          <IndianRupee className="w-4 h-4" style={{ color: "var(--color-ink-muted)" }} />
          <span className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            Total spent
          </span>
          <span className="font-display font-semibold">₹{totalSpent}</span>
        </Card>
      </div>

      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-4">Upcoming</h2>
        {upcomingBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming bookings"
            description="When you book a parking slot, it'll show up here."
            action={
              <Link to="/search">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                >
                  <Search className="w-4 h-4" /> Find parking
                </span>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onCancel={handleCancel}
                cancelling={cancellingId === b._id}
                onPay={handlePay}
                paying={payingId === b._id}
                highlighted={b._id === highlightId}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-4">History</h2>
        {bookingHistory.length === 0 ? (
          <EmptyState icon={Calendar} title="No past bookings yet" />
        ) : (
          <div className="space-y-3">
            {bookingHistory.map((b) => (
              <BookingCard key={b._id} booking={b} onCancel={handleCancel} cancelling={false} onPay={handlePay} paying={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Bookings;
