import { useState } from 'react';
import { ArrowRight, LayoutDashboard, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLoginMutation } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AuthFooter } from './AuthFooter';
import { SocialLogin } from './SocialLogin';

export function LoginCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        variant: 'destructive',
        title: 'Invalid credentials',
        description: 'Email and password are required.'
      });
      return;
    }
    loginMutation.mutate({ credentials: { email: email.trim(), password }, rememberDevice });
  };

  return (
    <>
      <div className="glass-card w-full p-8 sm:p-9">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
            <LayoutDashboard className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mini Jira Cloud</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Log in to your workspace to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:text-primary-dark"
                onClick={() =>
                  toast({ title: 'Forgot password', description: 'Reset via AWS Cognito when enabled.' })
                }
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberDevice}
              onCheckedChange={(c) => setRememberDevice(c === true)}
              disabled={loginMutation.isPending}
            />
            <label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
              Remember this device
            </label>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            Or continue with
          </span>
        </div>

        <SocialLogin />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Mini Jira?{' '}
          <button
            type="button"
            className="font-semibold text-primary hover:text-primary-dark"
            onClick={() => toast({ title: 'Sign up', description: 'Registration via Cognito when enabled.' })}
          >
            Sign up for an account
          </button>
        </p>
      </div>
      <AuthFooter />
    </>
  );
}
