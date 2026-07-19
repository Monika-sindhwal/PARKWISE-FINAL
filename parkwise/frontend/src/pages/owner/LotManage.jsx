import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Car, Bike, Truck, Zap, MapPin, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

const vehicleIcons = { car: Car, bike: Bike, truck: Truck, ev: Zap };
const emptySlotForm = { slotNumber: "", vehicleType: "car", pricePerHour: "", floor: 0 };

const LotManage = () => {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySlotForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/parking-lots/${id}`);
      setLot(res.data.parkingLot);
      setSlots(res.data.slots);
    } catch {
      toast.error("Couldn't load this lot.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!form.slotNumber || !form.pricePerHour) {
      toast.error("Slot number and price are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/parking-lots/${id}/slots`, {
        ...form,
        pricePerHour: parseFloat(form.pricePerHour),
        floor: parseInt(form.floor) || 0,
      });
      toast.success("Slot added.");
      setForm(emptySlotForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add the slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (slot) => {
    setUpdatingId(slot._id);
    const nextStatus = slot.status === "maintenance" ? "available" : "maintenance";
    try {
      await api.put(`/parking-lots/${id}/slots/${slot._id}`, { status: nextStatus });
      toast.success(nextStatus === "maintenance" ? "Slot marked under maintenance." : "Slot reopened.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update the slot.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    setDeletingId(slotId);
    try {
      await api.delete(`/parking-lots/${id}/slots/${slotId}`);
      toast.success("Slot deleted.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete the slot.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-28 w-full rounded-2xl mb-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/owner/lots"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to my lots
      </Link>

      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-display text-2xl font-semibold">{lot.name}</h1>
          <StatusBadge status={lot.status} />
        </div>
        <div className="flex items-center gap-1.5 text-sm mb-1" style={{ color: "var(--color-ink-muted)" }}>
          <MapPin className="w-4 h-4" /> {lot.address}, {lot.city}
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-muted)" }}>
          <Clock className="w-4 h-4" /> {lot.openingTime} – {lot.closingTime}
        </div>
        {lot.status === "pending" && (
          <p className="text-xs mt-3" style={{ color: "#B45309" }}>
            Waiting on admin approval — this lot won't appear in public search until then.
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Slots</h2>
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add slot"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleAddSlot} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Slot number" name="slotNumber" value={form.slotNumber} onChange={handleChange} placeholder="A1" />
              <Input
                label="Price per hour (₹)"
                name="pricePerHour"
                type="number"
                min="0"
                value={form.pricePerHour}
                onChange={handleChange}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Vehicle type</label>
                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="truck">Truck</option>
                  <option value="ev">EV</option>
                </select>
              </div>
              <Input label="Floor" name="floor" type="number" min="0" value={form.floor} onChange={handleChange} />
            </div>
            <Button type="submit" loading={submitting} className="w-full">
              Add slot
            </Button>
          </form>
        </Card>
      )}

      {slots.length === 0 ? (
        <EmptyState icon={Car} title="No slots yet" description='Click "Add slot" to create your first one.' />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {slots.map((slot) => {
            const Icon = vehicleIcons[slot.vehicleType] || Car;
            return (
              <Card key={slot._id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: "var(--color-ink-muted)" }} />
                    <span className="font-semibold">{slot.slotNumber}</span>
                  </div>
                  <StatusBadge status={slot.status} />
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>
                  ₹{slot.pricePerHour}/hr · Floor {slot.floor}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-xs px-2.5 py-1.5 flex-1"
                    loading={updatingId === slot._id}
                    disabled={slot.status === "occupied"}
                    onClick={() => handleToggleMaintenance(slot)}
                  >
                    {slot.status === "maintenance" ? "Reopen" : "Maintenance"}
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    className="text-xs px-2.5 py-1.5"
                    loading={deletingId === slot._id}
                    disabled={slot.status === "occupied"}
                    onClick={() => handleDeleteSlot(slot._id)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LotManage;
