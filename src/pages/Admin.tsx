import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/hooks/useAuth';
import { AdminReportsTable } from '@/components/AdminReportsTable';
import { AdminUsersTable } from '@/components/AdminUsersTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="space-y-8">
          <AdminReportsTable />
          <AdminUsersTable />
        </div>
      </div>
    </div>
  );
};

export default Admin;
