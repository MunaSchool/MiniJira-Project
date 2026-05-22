import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { Callback } from '@/pages/Callback';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Toaster } from 'sonner';

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <LoginPage />;
  return <KanbanBoard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/callback" element={<Callback />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}