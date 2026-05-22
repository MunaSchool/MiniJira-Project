
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Mini‑Jira</h1>
        <Button onClick={login} className="w-full">Sign in with Cognito</Button>
        <p className="text-sm text-center mt-4 text-gray-600">New user? Create an account during sign‑in.</p>
      </div>
    </div>
  );
};
