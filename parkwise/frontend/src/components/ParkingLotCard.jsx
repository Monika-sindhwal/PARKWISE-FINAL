import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import Card from "./ui/Card";

const ParkingLotCard = ({ lot }) => {
  return (
    <Link to={`/parking/${lot._id}`}>
      <Card hoverable className="p-5 h-full flex flex-col">
        <h3 className="font-semibold text-lg mb-1">{lot.name}</h3>
        <div className="flex items-start gap-1.5 text-sm mb-1" style={{ color: "var(--color-ink-muted)" }}>
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {lot.address}, {lot.city}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--color-ink-muted)" }}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {lot.openingTime} – {lot.closingTime}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-1 text-sm font-medium" style={{ color: "var(--color-primary)" }}>
          View slots <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
};

export default ParkingLotCard;
