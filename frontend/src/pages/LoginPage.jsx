import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", industry: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success("Account created successfully");
      } else {
        await login(form.email, form.password);
        toast.success("Welcome back to SolisBoard");
      }
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex bg-zinc-950" data-testid="login-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-zinc-950 to-zinc-950" />
        <div className="relative z-10 max-w-md px-12">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight font-[Outfit]">
              Solis<span className="text-orange-500">Board</span>
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-[Outfit] text-white mb-4 leading-tight">
            AI-Powered Social Media Command Center
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Generate content with Claude, GPT-4o & Gemini. Schedule posts. Track performance. All in one intelligent dashboard.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {["Multi-model AI content generation", "Campaign ideation engine", "Smart caption variations"].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-[Outfit]">
              Solis<span className="text-orange-500">Board</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight font-[Outfit] text-white mb-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-zinc-500 mb-8 text-sm">
            {isRegister ? "Start managing your social media with AI" : "Sign in to your SolisBoard dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                  <Input
                    id="name" data-testid="register-name-input"
                    value={form.name} onChange={update("name")} required
                    placeholder="Jane Doe"
                    className="bg-zinc-900/50 border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 h-11 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-zinc-300 text-sm">Company</Label>
                    <Input
                      id="company" data-testid="register-company-input"
                      value={form.company} onChange={update("company")}
                      placeholder="Acme Inc"
                      className="bg-zinc-900/50 border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 h-11 text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-zinc-300 text-sm">Industry</Label>
                    <Input
                      id="industry" data-testid="register-industry-input"
                      value={form.industry} onChange={update("industry")}
                      placeholder="SaaS"
                      className="bg-zinc-900/50 border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 h-11 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
              <Input
                id="email" type="email" data-testid="login-email-input"
                value={form.email} onChange={update("email")} required
                placeholder="you@company.com"
                className="bg-zinc-900/50 border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 h-11 text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
              <Input
                id="password" type="password" data-testid="login-password-input"
                value={form.password} onChange={update("password")} required
                placeholder="Min 6 characters"
                className="bg-zinc-900/50 border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 h-11 text-white placeholder:text-zinc-600"
              />
            </div>

            <Button
              type="submit" data-testid="auth-submit-btn"
              disabled={loading}
              className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isRegister ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode-btn"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              {isRegister ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
