import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  total_footprint: number;
  total_points: number;
  rank: number;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Get profiles with their totals and rank by lowest carbon footprint
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, total_carbon_footprint, total_green_points')
        .order('total_carbon_footprint', { ascending: true })
        .limit(10);

      if (error) throw error;

      const leaderboardData = data?.map((profile, index) => ({
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.display_name || 'Anonymous',
        total_footprint: profile.total_carbon_footprint || 0,
        total_points: profile.total_green_points || 0,
        rank: index + 1,
      })) || [];

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eco Champions</CardTitle>
          <CardDescription>Loading leaderboard...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eco Champions</CardTitle>
        <CardDescription>Lowest carbon footprint leaders</CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-green-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(entry.rank)}
                  <div>
                    <p className="font-medium">{entry.display_name}</p>
                    <p className="text-sm text-gray-500">
                      {entry.total_footprint.toFixed(2)} kg CO₂e
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getRankBadgeVariant(entry.rank)}>
                    #{entry.rank}
                  </Badge>
                  {entry.total_points > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {entry.total_points} points
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No champions yet</p>
            <p className="text-sm text-gray-400">Be the first to log activities!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};