import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { AuthFooter } from './AuthFooter';
import { SocialLogin } from './SocialLogin';

export function LoginCard() {
  const { login } = useAuth();

  return (
    <>
      <div className="glass-card w-full p-8 sm:p-9">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <LayoutDashboard className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mini Jira Cloud</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Log in to your workspace to continue.</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be redirected to AWS Cognito Hosted UI, then returned to this app after sign-in.
          </p>
          <Button type="button" className="w-full" onClick={() => login()}>
            <ArrowRight className="h-4 w-4" />
            Continue with Cognito
          </Button>
        </div>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            Or continue with
          </span>
        </div>

        <SocialLogin />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Mini Jira?{' '}
          <Link className="font-semibold text-primary hover:text-primary-dark" to="/signup">
            Sign up for an account
          </Link>
        </p>
      </div>
      <AuthFooter />
    </>
  );
}
