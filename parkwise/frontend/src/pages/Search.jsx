import { useState } from "react";
import { Search as SearchIcon, MapPin, Navigation } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ParkingLotCard from "../components/ParkingLotCard";

const Search = () => {
  const [city, setCity] = useState("");
  const [lots, setLots] = useState(null); // null = no search yet
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resultLabel, setResultLabel] = useState("");

  const searchByCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setResultLabel(`Results for "${city}"`);
    try {
      const res = await api.get("/parking-lots", { params: { city: city.trim() } });
      setLots(res.data.parkingLots);
    } catch {
      toast.error("Couldn't load parking lots. Please try again.");
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const searchNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location search.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false);
        setLoading(true);
        setResultLabel("Parking near you");
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get("/parking-lots/nearby", {
            params: { lat: latitude, lng: longitude, radius: 10 },
          });
          setLots(res.data.parkingLots);
        } catch {
          toast.error("Couldn't load nearby parking lots.");
          setLots([]);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location access denied. Try searching by city instead.");
        } else {
          toast.error("Couldn't get your location. Try searching by city instead.");
        }
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1">Find parking</h1>
      <p className="text-sm sm:text-base mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Search by city, or use your current location.
      </p>

      <form onSubmit={searchByCity} className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          icon={MapPin}
          placeholder="Enter a city, e.g. Ludhiana"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-3">
          <Button type="submit" icon={SearchIcon} loading={loading && !locating}>
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={Navigation}
            loading={locating}
            onClick={searchNearby}
          >
            Near me
          </Button>
        </div>
      </form>

      {lots === null && !loading && (
        <EmptyState
          icon={SearchIcon}
          title="Search to see results"
          description='Try a city name, or tap "Near me" to find parking closest to you right now.'
        />
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ border: "1px solid var(--color-border)" }}>
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && lots !== null && (
        <>
          {resultLabel && (
            <p className="text-sm font-medium mb-4" style={{ color: "var(--color-ink-muted)" }}>
              {resultLabel} · {lots.length} {lots.length === 1 ? "result" : "results"}
            </p>
          )}
          {lots.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No parking lots found"
              description="Try a different city, or expand your search radius."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lots.map((lot) => (
                <ParkingLotCard key={lot._id} lot={lot} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
