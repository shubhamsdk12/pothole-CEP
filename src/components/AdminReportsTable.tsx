import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Report {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  address: string | null;
  severity: string | null;
  description: string | null;
  status: string | null;
  issue_type: string | null;
  urgency: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export const AdminReportsTable = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: reportsData, error: reportsError } = await supabase
      .from('pothole_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportsError) {
      toast.error('Failed to fetch reports');
      console.error(reportsError);
      setLoading(false);
      return;
    }

    // Fetch profiles for all users
    const userIds = [...new Set(reportsData?.map(r => r.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Combine the data
    const reportsWithProfiles = reportsData?.map(report => ({
      ...report,
      profiles: profilesData?.find(profile => profile.user_id === report.user_id) || null
    })) || [];

    setReports(reportsWithProfiles as any);
    setLoading(false);
  };

  const handleMarkResolved = async (reportId: string) => {
    const { error } = await supabase
      .from('pothole_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to mark report as resolved');
      console.error(error);
    } else {
      toast.success('Report marked as resolved');
      fetchReports();
    }
    setSelectedReport(null);
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading reports...</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-sm">
                    {format(new Date(report.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="capitalize">{report.issue_type || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{report.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-muted-foreground text-xs">{report.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {report.address || `${report.latitude}, ${report.longitude}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(report.severity)}>
                      {report.severity || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.urgency || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps?q=${report.latitude},${report.longitude}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {report.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedReport(report.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Report as Resolved</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the report as resolved and award the user 10 additional credits. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedReport && handleMarkResolved(selectedReport)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
