import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhotoCapture from '@/components/PhotoCapture';
import ReportsList from '@/components/ReportsList';
import { LogOut, Camera, List, Shield } from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">PotholeWatch</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <p className="text-muted-foreground">
                Help make roads safer by reporting potholes in your community. 
                Your reports are automatically sent to local authorities.
              </p>
            </CardHeader>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="report" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="report" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Report Issue
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                My Reports
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="report" className="mt-6">
              <PhotoCapture />
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <ReportsList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
