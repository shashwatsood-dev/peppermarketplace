import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    const success = login(email, password);
    if (!success) {
      toast.error("Invalid email or password");
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
          <CardDescription className="text-xs">Sign in to access marketplace operations</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
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
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="pl-9 h-9 bg-muted border-border text-[13px]" />
              </div>
            </div>
            <Button type="submit" className="w-full h-9">Sign In</Button>
          </form>
          <div className="mt-4 p-2.5 rounded-md bg-muted border border-border">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Demo Accounts</p>
            <div className="space-y-0.5 text-[11px] text-muted-foreground">
              <p><strong className="text-foreground">Admin:</strong> admin@pepper.com / admin123</p>
              <p><strong className="text-foreground">Recruiter:</strong> recruiter@pepper.com / recruiter123</p>
              <p><strong className="text-foreground">AM Lead:</strong> amlead@pepper.com / amlead123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
