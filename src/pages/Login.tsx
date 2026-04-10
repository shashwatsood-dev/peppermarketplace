import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { login, signup, isAuthenticated, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (isSignup && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const err = await signup(email, password, name.trim());
        if (err) {
          toast.error(err);
        } else {
          toast.success("Account created successfully!");
        }
      } else {
        const err = await login(email, password);
        if (err) {
          toast.error(err);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="text-center space-y-1.5 pb-4">
          <div className="mx-auto h-9 w-9 rounded-md bg-primary flex items-center justify-center mb-1">
            <span className="text-primary-foreground font-mono font-semibold text-xs">MP</span>
          </div>
          <CardTitle className="text-base">Procurement Suite</CardTitle>
          <CardDescription className="text-xs">
            {isSignup ? "Create an account to get started" : "Sign in to access marketplace operations"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name" className="pl-9 h-9 bg-muted border-border text-[13px]" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@pepper.com" className="pl-9 h-9 bg-muted border-border text-[13px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="pl-9 pr-9 h-9 bg-muted border-border text-[13px]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-9" disabled={submitting}>
              {submitting ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-primary hover:underline"
            >
              {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
