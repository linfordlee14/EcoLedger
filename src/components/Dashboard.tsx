import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
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
  Utensils
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
  const { user } = useAuth();
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
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
      } else {
        console.warn('No profile found, it may still be creating');
      }
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
      <Layout title="Dashboard" description="Track your environmental impact">
        <div className="text-center py-8">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (showActivityLogger) {
    return <ActivityLogger onBack={() => setShowActivityLogger(false)} onActivityLogged={handleActivityLogged} />;
  }

  return (
    <Layout title="Your Environmental Impact" description="Track, improve, and celebrate your eco-friendly choices">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-card rounded-2xl p-4 shadow-md text-center border">
          <h3 className="text-muted-foreground text-sm mb-2">Lifetime emissions tracked</h3>
          <p className="text-2xl font-bold text-destructive">
            {profile?.total_carbon_footprint?.toFixed(2) || '0.00'} kg CO₂e
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-md text-center border">
          <h3 className="text-muted-foreground text-sm mb-2">Points earned</h3>
          <p className="text-2xl font-bold text-primary">
            {profile?.total_green_points || 0} pts
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-md text-center border">
          <h3 className="text-muted-foreground text-sm mb-2">Recent activities</h3>
          <p className="text-2xl font-bold text-accent">
            {recentActivities.length} logged
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setShowActivityLogger(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow hover:opacity-90 transition-opacity"
        >
          🚗 Car Trip
        </button>
        <button 
          onClick={() => setShowActivityLogger(true)}
          className="bg-accent text-accent-foreground px-4 py-2 rounded-xl shadow hover:opacity-90 transition-opacity"
        >
          ⚡ Electricity
        </button>
        <button 
          onClick={() => setShowActivityLogger(true)}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl shadow hover:opacity-90 transition-opacity"
        >
          ♻️ Recycling
        </button>
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activities */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="card-enhanced">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Leaf className="h-6 w-6 text-primary" />
                      </div>
                      Recent Activities
                    </CardTitle>
                    <CardDescription className="text-base">Track your latest environmental actions</CardDescription>
                  </div>
                  <Button onClick={() => setShowActivityLogger(true)} className="hover-lift gradient-bg">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={activity.id} className="group p-6 border rounded-xl hover:shadow-[var(--shadow-medium)] transition-all duration-300 hover:border-primary/20 bg-card/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                              {getCategoryIcon(activity.category.name)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-lg">{activity.activity_description}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{new Date(activity.logged_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="capitalize">{activity.category.name}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-xl font-bold text-foreground">{activity.carbon_amount.toFixed(2)} <span className="text-sm text-muted-foreground">kg CO₂e</span></p>
                            {activity.green_points_earned > 0 && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                +{activity.green_points_earned} points
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="p-6 rounded-full bg-primary/5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Leaf className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No activities yet</h3>
                    <p className="text-muted-foreground mb-6">Start tracking your environmental impact today</p>
                    <Button 
                      className="gradient-bg hover-lift" 
                      onClick={() => setShowActivityLogger(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
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
    </Layout>
  );
};