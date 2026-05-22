import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Eye, EyeOff, LayoutDashboard, Loader2, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSignupMutation } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { SocialLogin } from './SocialLogin';

function getPasswordStrength(password: string) {
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: 'Strong', percent: 100, color: 'bg-emerald-400' };
  }
  if (password.length >= 8) {
    return { label: 'Medium', percent: 66, color: 'bg-amber-400' };
  }
  if (password.length >= 1) {
    return { label: 'Weak', percent: 40, color: 'bg-rose-400' };
  }
  return { label: 'Medium', percent: 0, color: 'bg-muted' };
}

export function SignupCard() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const signupMutation = useSignupMutation();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !organization.trim() || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill out all fields to continue.'
      });
      return;
    }
    if (!agreed) {
      toast({
        variant: 'destructive',
        title: 'Terms required',
        description: 'Please agree to the Terms of Service to continue.'
      });
      return;
    }
    signupMutation.mutate({
      payload: {
        name: fullName.trim(),
        email: email.trim(),
        organizationName: organization.trim(),
        password
      }
    });
  };

  return (
    <div className="glass-card w-full p-8 sm:p-9">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <LayoutDashboard className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Mini Jira Cloud</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Create your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Alex Rivera"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={signupMutation.isPending}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Work Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={signupMutation.isPending}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organization">Organization Name</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="organization"
              type="text"
              autoComplete="organization"
              placeholder="Acme Corp"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              disabled={signupMutation.isPending}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={signupMutation.isPending}
              className="pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {strength.label} Security
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            disabled={signupMutation.isPending}
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground">
            I agree to the{' '}
            <span className="font-semibold text-primary">Terms of Service</span> and{' '}
            <span className="font-semibold text-primary">Privacy Policy</span>.
          </label>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Complete Sign Up
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          Or continue with
        </span>
      </div>

      <SocialLogin mode="signup" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
