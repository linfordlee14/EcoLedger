import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-effect border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-bg p-2 rounded-xl shadow-[var(--shadow-soft)]">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">EcoLedger</h1>
                <p className="text-sm text-muted-foreground">Carbon tracking made simple</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium">Welcome back,</p>
                <p className="text-lg font-semibold text-primary">{profile?.display_name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="hover-lift">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Stats Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">Your Environmental Impact</h2>
          <p className="text-muted-foreground text-lg">Track, improve, and celebrate your eco-friendly choices</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="card-enhanced hover-lift overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Carbon Footprint</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {profile?.total_carbon_footprint?.toFixed(2)} <span className="text-lg text-muted-foreground">kg CO₂e</span>
              </div>
              <p className="text-sm text-muted-foreground">Lifetime emissions tracked</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover-lift overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Green Points</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">
                {profile?.total_green_points} <span className="text-lg text-muted-foreground">pts</span>
              </div>
              <p className="text-sm text-muted-foreground">Earned from eco actions</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover-lift overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activities</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Leaf className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {recentActivities.length} <span className="text-lg text-muted-foreground">logged</span>
              </div>
              <p className="text-sm text-muted-foreground">Recent activities</p>
            </CardContent>
          </Card>
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
      </div>
    </div>
  );
};