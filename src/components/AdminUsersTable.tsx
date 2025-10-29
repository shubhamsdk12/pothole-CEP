import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trophy, Medal, Award } from 'lucide-react';

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  credits: number;
  total_reports: number;
  resolved_reports: number;
  created_at: string;
  user_medals: Array<{
    medal_type: string;
  }>;
}

export const AdminUsersTable = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_medals (
          medal_type
        )
      `)
      .order('credits', { ascending: false });

    if (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const getMedalIcon = (type: string) => {
    switch (type) {
      case 'platinum': return <Trophy className="h-4 w-4" />;
      case 'gold': return <Medal className="h-4 w-4" />;
      case 'silver': return <Award className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading users...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Total Reports</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead>Medals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="default">{user.credits}</Badge>
                </TableCell>
                <TableCell>{user.total_reports}</TableCell>
                <TableCell>{user.resolved_reports}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user.user_medals?.map((medal, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        {getMedalIcon(medal.medal_type)}
                        {medal.medal_type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
