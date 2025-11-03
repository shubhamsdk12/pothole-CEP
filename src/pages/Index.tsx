import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhotoCapture from '@/components/PhotoCapture';
import ReportsList from '@/components/ReportsList';
import IssueReportForm from '@/components/IssueReportForm';
import CreditsDisplay from '@/components/CreditsDisplay';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Camera, List, Shield, AlertTriangle, Trophy } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useState } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const [activeTab, setActiveTab] = useState('pothole');

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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-primary">CivicWatch</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <NavigationMenu className="hidden md:block">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#" onClick={() => setActiveTab('pothole')}>
                      <Camera className="h-4 w-4 mr-2" />
                      Report Pothole
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#" onClick={() => setActiveTab('other')}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Other Issues
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#" onClick={() => setActiveTab('credits')}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Credits
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <p className="text-muted-foreground">
                Report civic issues and earn rewards! Every report earns you 10 credits, plus 10 more when resolved. 
                Collect medals as you contribute to your community.
              </p>
            </CardHeader>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pothole" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Potholes
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Other Issues
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Credits
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                My Reports
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pothole" className="mt-6">
              <div className="max-w-md mx-auto">
                <PhotoCapture />
              </div>
            </TabsContent>
            
            <TabsContent value="other" className="mt-6">
              <div className="max-w-md mx-auto">
                <IssueReportForm />
              </div>
            </TabsContent>

            <TabsContent value="credits" className="mt-6">
              <div className="max-w-md mx-auto">
                <CreditsDisplay />
              </div>
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
