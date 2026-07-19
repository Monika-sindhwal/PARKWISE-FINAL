import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Car, SquareParking, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    vehicleNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const validate = () => {
    const next = {};
    if (!form.name) next.name = "Name is required";
    if (!form.email) next.email = "Email is required";
    if (!form.password || form.password.length < 6)
      next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await register(form);
      toast.success(`Account created — welcome, ${user.name.split(" ")[0]}!`);
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-77px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "var(--color-primary)" }}
          >
            <SquareParking className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Create your account</h1>
          <p className="text-sm mt-1 text-center" style={{ color: "var(--color-ink-muted)" }}>
            Book parking in seconds, or list your own lot
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role picker - signage-style toggle rather than a plain dropdown */}
            <div>
              <label className="block text-sm font-medium mb-1.5">I want to...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "customer" })}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all duration-150"
                  style={{
                    borderColor: form.role === "customer" ? "var(--color-primary)" : "var(--color-border)",
                    background: form.role === "customer" ? "#EEF2FE" : "transparent",
                  }}
                >
                  <Car
                    className="w-5 h-5"
                    style={{ color: form.role === "customer" ? "var(--color-primary)" : "var(--color-ink-muted)" }}
                  />
                  <span className="text-xs font-medium">Find parking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "owner" })}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all duration-150"
                  style={{
                    borderColor: form.role === "owner" ? "var(--color-primary)" : "var(--color-border)",
                    background: form.role === "owner" ? "#EEF2FE" : "transparent",
                  }}
                >
                  <Building2
                    className="w-5 h-5"
                    style={{ color: form.role === "owner" ? "var(--color-primary)" : "var(--color-ink-muted)" }}
                  />
                  <span className="text-xs font-medium">List my lot</span>
                </button>
              </div>
            </div>

            <Input
              label="Full name"
              icon={User}
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Jasleen Kaur"
              autoComplete="name"
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              icon={Lock}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <Input
              label="Phone (optional)"
              icon={Phone}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="98765 43210"
            />
            {form.role === "customer" && (
              <Input
                label="Vehicle number (optional)"
                icon={Car}
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleChange}
                placeholder="PB10AB1234"
              />
            )}

            <Button type="submit" loading={submitting} className="w-full mt-2">
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-ink-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
