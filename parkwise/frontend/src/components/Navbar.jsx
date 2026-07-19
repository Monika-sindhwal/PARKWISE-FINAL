import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SquareParking, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link to={user ? "/home" : "/"} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}
          >
            <SquareParking className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display text-lg font-bold">ParkWise</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5 text-sm">
          {user ? (
            <>
              <div className="text-right leading-tight">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--color-ink-muted)" }}>
                  {user.role}
                </p>
              </div>
              <Button variant="dark" icon={LogOut} onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium hover:underline">
                Log in
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign up</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="sm:hidden p-2 -mr-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="sm:hidden px-4 pb-4 flex flex-col gap-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {user ? (
            <>
              <div className="pt-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--color-ink-muted)" }}>
                  {user.role}
                </p>
              </div>
              <Button variant="dark" icon={LogOut} onClick={handleLogout} className="w-full justify-center">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium py-2" onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" className="w-full justify-center">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      <div className="stripe-accent" />
    </header>
  );
};

export default Navbar;
