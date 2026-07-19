import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, IndianRupee, CircleParking, CircleX, Plus, MapPin, Navigation } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  lat: "",
  lng: "",
  openingTime: "08:00",
  closingTime: "22:00",
  totalFloors: 1,
};

const OwnerLots = () => {
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lotsRes, statsRes] = await Promise.all([
        api.get("/parking-lots/my"),
        api.get("/dashboard/owner"),
      ]);
      setLots(lotsRes.data.parkingLots);
      setStats(statsRes.data);
    } catch {
      toast.error("Couldn't load your parking lots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setLocating(false);
        toast.success("Location captured.");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      toast.error("Please set coordinates using \"Use my location\".");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/parking-lots", {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        totalFloors: parseInt(form.totalFloors) || 1,
      });
      toast.success("Lot created! It'll appear publicly once an admin approves it.");
      setForm(emptyForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create the lot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">My parking lots</h1>
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add lot"}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Building2} label="Total lots" value={stats.totalLots} tint="primary" />
        <StatCard icon={IndianRupee} label="Revenue" value={`₹${stats.revenue}`} tint="accent" />
        <StatCard icon={CircleParking} label="Available slots" value={stats.availableSlots} tint="available" />
        <StatCard icon={CircleX} label="Occupied slots" value={stats.occupiedSlots} tint="occupied" />
      </div>

      {showForm && (
        <Card className="p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Add a new lot</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Lot name" name="name" value={form.name} onChange={handleChange} required />
              <Input label="City" name="city" value={form.city} onChange={handleChange} required />
            </div>
            <Input label="Address" name="address" value={form.address} onChange={handleChange} required />

            <div>
              <label className="block text-sm font-medium mb-1.5">Coordinates</label>
              <div className="flex gap-2">
                <Input
                  icon={MapPin}
                  name="lat"
                  value={form.lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="flex-1"
                />
                <Input name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude" className="flex-1" />
                <Button type="button" variant="outline" icon={Navigation} loading={locating} onClick={handleUseLocation}>
                  Use my location
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Opening time</label>
                <input
                  type="time"
                  name="openingTime"
                  value={form.openingTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Closing time</label>
                <input
                  type="time"
                  name="closingTime"
                  value={form.closingTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <Input
                label="Total floors"
                name="totalFloors"
                type="number"
                min="1"
                value={form.totalFloors}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Create lot
            </Button>
          </form>
        </Card>
      )}

      {lots.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No parking lots yet"
          description='Click "Add lot" to list your first parking space.'
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <Link key={lot._id} to={`/owner/lots/${lot._id}`}>
              <Card hoverable className="p-5 h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{lot.name}</h3>
                  <StatusBadge status={lot.status} />
                </div>
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  {lot.address}, {lot.city}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerLots;
