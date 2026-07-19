import { useEffect, useState } from "react";
import { Users, Building2, Calendar, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/admin");
        setStats(res.data);
      } catch {
        toast.error("Couldn't load platform stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-8">Platform overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} tint="primary" />
        <StatCard icon={Building2} label="Parking lots" value={stats.totalParkingLots} tint="accent" />
        <StatCard icon={Calendar} label="Total bookings" value={stats.totalBookings} tint="available" />
        <StatCard icon={IndianRupee} label="Total revenue" value={`₹${stats.totalRevenue}`} tint="occupied" />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Lots by status</h2>
          <div className="space-y-3">
            {Object.entries(stats.lotsByStatus).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                No lots yet.
              </p>
            ) : (
              Object.entries(stats.lotsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Users by role</h2>
          <div className="space-y-3">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="capitalize" style={{ color: "var(--color-ink-muted)" }}>
                  {role}
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
