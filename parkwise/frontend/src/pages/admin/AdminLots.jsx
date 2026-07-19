import { useEffect, useState } from "react";
import { Building2, MapPin, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

const filters = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "" },
];

const AdminLots = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [actingId, setActingId] = useState(null);

  const fetchLots = async (status) => {
    setLoading(true);
    try {
      const res = await api.get("/parking-lots/admin/all", {
        params: status ? { status } : {},
      });
      setLots(res.data.parkingLots);
    } catch {
      toast.error("Couldn't load parking lots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const handleDecision = async (lotId, status) => {
    setActingId(lotId);
    try {
      await api.patch(`/parking-lots/${lotId}/approve`, { status });
      toast.success(status === "approved" ? "Lot approved." : "Lot rejected.");
      fetchLots(activeFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update this lot.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Manage parking lots</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
            style={{
              borderColor: activeFilter === f.value ? "var(--color-primary)" : "var(--color-border)",
              background: activeFilter === f.value ? "#EEF2FE" : "transparent",
              color: activeFilter === f.value ? "var(--color-primary)" : "var(--color-ink-muted)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <EmptyState icon={Building2} title="No lots here" description="Nothing matches this filter right now." />
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <Card key={lot._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{lot.name}</h3>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    <MapPin className="w-3.5 h-3.5" /> {lot.address}, {lot.city}
                  </div>
                </div>
                {lot.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="primary"
                      icon={Check}
                      className="text-xs px-3 py-1.5"
                      loading={actingId === lot._id}
                      onClick={() => handleDecision(lot._id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      icon={X}
                      className="text-xs px-3 py-1.5"
                      loading={actingId === lot._id}
                      onClick={() => handleDecision(lot._id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLots;
