import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Input, PasswordInput, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "engineer") navigate("/engineer");
      else navigate("/client");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-accent" fill="currentColor" />
          <span className="text-lg font-semibold tracking-tight text-zinc-50">Steadfast</span>
        </div>

        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-zinc-100">Sign in</h2>
          <p className="mb-6 text-sm text-zinc-500">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Steadfast — internal operations platform for Bright Electricals
        </p>
      </div>
    </div>
  );
}
