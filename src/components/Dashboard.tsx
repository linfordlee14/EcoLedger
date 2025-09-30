import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Leaf, 
  TrendingUp, 
  Trophy, 
  Plus, 
  Car, 
  Zap, 
  Utensils,
  LogOut
} from 'lucide-react';
import { ActivityLogger } from './ActivityLogger';
import { EmissionsChart } from './EmissionsChart';
import { Leaderboard } from './Leaderboard';

interface Profile {
  id: string;
  display_name: string;
  total_carbon_footprint: number;
  total_green_points: number;
}

interface RecentActivity {
  id: string;
  activity_description: string;
  carbon_amount: number;
  green_points_earned: number;
  logged_at: string;
  category: {
    name: string;
    unit: string;
  };
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRecentActivities();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_emissions')
        .select(`
          *,
          category:activity_categories(name, unit)
        `)
        .eq('user_id', user?.id)
        .order('logged_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleActivityLogged = () => {
    fetchProfile();
    fetchRecentActivities();
    setShowActivityLogger(false);
    toast({
      title: "Activity logged!",
      description: "Your carbon footprint has been updated.",
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Transportation')) return <Car className="h-4 w-4" />;
    if (categoryName.includes('Energy')) return <Zap className="h-4 w-4" />;
    if (categoryName.includes('Food')) return <Utensils className="h-4 w-4" />;
    return <Leaf className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showActivityLogger) {
    return <ActivityLogger onBack={() => setShowActivityLogger(false)} onActivityLogged={handleActivityLogged} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">EcoLedger</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.display_name}</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Carbon Footprint</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_carbon_footprint?.toFixed(2)} kg CO₂e</div>
              <p className="text-xs text-muted-foreground">Lifetime emissions tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Green Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{profile?.total_green_points}</div>
              <p className="text-xs text-muted-foreground">Points earned from eco actions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentActivities.length}</div>
              <p className="text-xs text-muted-foreground">Recent activities</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activities */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Your latest carbon footprint entries</CardDescription>
                  </div>
                  <Button onClick={() => setShowActivityLogger(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(activity.category.name)}
                          <div>
                            <p className="font-medium">{activity.activity_description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(activity.logged_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{activity.carbon_amount.toFixed(2)} kg CO₂e</p>
                          {activity.green_points_earned > 0 && (
                            <Badge variant="secondary" className="text-green-600">
                              +{activity.green_points_earned} points
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activities logged yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowActivityLogger(true)}
                    >
                      Log Your First Activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <EmissionsChart />
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};