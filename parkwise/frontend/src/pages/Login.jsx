import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, SquareParking } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(location.state?.from?.pathname || "/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't log in. Please try again.");
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
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>
            Log in to find and manage your parking
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <Button type="submit" loading={submitting} className="w-full mt-2">
              Log in
            </Button>
          </form>
        </Card>

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-ink-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
