import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Award, Star } from 'lucide-react';

const CreditsDisplay = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const [medals, setMedals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, total_reports, resolved_reports')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setCredits(profile.credits || 0);
        setTotalReports(profile.total_reports || 0);
        setResolvedReports(profile.resolved_reports || 0);
      }

      // Fetch medals
      const { data: medalsData } = await supabase
        .from('user_medals')
        .select('*')
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (medalsData) {
        setMedals(medalsData);
      }
    };

    fetchUserStats();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchUserStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_medals',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchUserStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getMedalIcon = (type: string) => {
    switch (type) {
      case 'platinum':
        return <Trophy className="h-5 w-5 text-purple-500" />;
      case 'gold':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'silver':
        return <Star className="h-5 w-5 text-gray-400" />;
      default:
        return <Star className="h-5 w-5 text-orange-600" />;
    }
  };

  const nextMilestone = Math.ceil(credits / 100) * 100;
  const progressToNext = ((credits % 100) / 100) * 100;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Credits Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h3 className="text-3xl font-bold text-primary">{credits}</h3>
            </div>
            <p className="text-sm text-muted-foreground">Total Credits</p>
          </div>

          {/* Progress to Next Medal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next medal</span>
              <span className="font-medium">{nextMilestone} credits</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{totalReports}</div>
              <div className="text-xs text-muted-foreground">Reports</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{resolvedReports}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>

          {/* Medals */}
          {medals.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Your Medals</h4>
              <div className="flex flex-wrap gap-2">
                {medals.map((medal) => (
                  <Badge
                    key={medal.id}
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5"
                  >
                    {getMedalIcon(medal.medal_type)}
                    <span className="capitalize">{medal.medal_type}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Info Text */}
          <div className="pt-2 text-xs text-muted-foreground text-center">
            Earn 10 credits per report + 10 more when resolved. Get medals every 100 credits!
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditsDisplay;
