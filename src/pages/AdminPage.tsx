import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { AdminPanel } from '@/components/AdminPanel';

const AdminPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <AdminPanel user={user} />;
};

export default AdminPage;