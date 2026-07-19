import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Search from "./pages/Search";
import LotDetails from "./pages/LotDetails";
import NewBooking from "./pages/NewBooking";
import Bookings from "./pages/Bookings";
import BookingQr from "./pages/BookingQr";
import VerifyQr from "./pages/VerifyQr";
import OwnerLots from "./pages/owner/OwnerLots";
import LotManage from "./pages/owner/LotManage";
import OwnerBookings from "./pages/owner/OwnerBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLots from "./pages/admin/AdminLots";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--color-ink)",
              color: "#fff",
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/parking/:id" element={<LotDetails />} />
          <Route
            path="/book/:lotId/:slotId"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <NewBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id/qr"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <BookingQr />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/verify"
            element={
              <ProtectedRoute allowedRoles={["owner", "admin"]}>
                <VerifyQr />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/lots"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <OwnerLots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/lots/:id"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <LotManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <OwnerBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lots"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
