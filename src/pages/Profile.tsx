import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Calendar, Trophy, Leaf, Target, Save, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string;
  total_carbon_footprint: number;
  total_green_points: number;
  created_at: string;
  show_on_leaderboard: boolean;
}

export const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ display_name: "", show_on_leaderboard: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
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
      setEditData({ 
        display_name: data.display_name || "",
        show_on_leaderboard: data.show_on_leaderboard ?? true
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!editData.display_name.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: editData.display_name.trim(),
          show_on_leaderboard: editData.show_on_leaderboard
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      setEditMode(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getJoinDate = () => {
    if (!profile?.created_at) return "Unknown";
    return new Date(profile.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEnvironmentalLevel = () => {
    if (!profile) return { level: "Beginner", color: "secondary" };
    
    const points = profile.total_green_points;
    if (points >= 1000) return { level: "Eco Master", color: "default" };
    if (points >= 500) return { level: "Green Champion", color: "default" };
    if (points >= 100) return { level: "Eco Warrior", color: "secondary" };
    return { level: "Green Starter", color: "secondary" };
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout title="Profile" description="Manage your account and view your environmental journey">
        <div className="text-center py-8">
          <User className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title="Profile" description="Manage your account and view your environmental journey">
        <Card className="card-enhanced">
          <CardContent className="text-center py-16">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground">
              Unable to load your profile information.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const environmentalLevel = getEnvironmentalLevel();

  return (
    <Layout title="Profile" description="Manage your account and view your environmental journey">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </div>
                <Button
                  variant={editMode ? "outline" : "default"}
                  onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={editData.display_name}
                      onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_on_leaderboard">Show on Leaderboard</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your stats on the leaderboard
                      </p>
                    </div>
                    <input
                      id="show_on_leaderboard"
                      type="checkbox"
                      checked={editData.show_on_leaderboard}
                      onChange={(e) => setEditData({ ...editData, show_on_leaderboard: e.target.checked })}
                      className="h-5 w-5 rounded border-input"
                    />
                  </div>
                  <Button 
                    onClick={updateProfile} 
                    disabled={saving}
                    className="w-full gradient-bg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Display Name</p>
                      <p className="text-muted-foreground">{profile.display_name || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Member Since</p>
                      <p className="text-muted-foreground">{getJoinDate()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Card className="card-enhanced">
            <CardContent className="pt-6">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* Environmental Stats */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Environmental Impact
              </CardTitle>
              <CardDescription>Your contribution to environmental sustainability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">{profile.total_green_points}</p>
                  <p className="text-sm text-muted-foreground">Green Points Earned</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{profile.total_carbon_footprint.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">kg CO₂e Tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Achievements & Level */}
        <div className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Environmental Level
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Leaf className="h-10 w-10 text-white" />
                </div>
                <Badge variant={environmentalLevel.color as any} className="text-sm px-3 py-1">
                  {environmentalLevel.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Keep logging activities and earning green points to advance your level!
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your environmental milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.total_green_points >= 10 && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">First Steps</p>
                      <p className="text-xs text-muted-foreground">Earned 10 green points</p>
                    </div>
                  </div>
                )}
                {profile.total_green_points >= 100 && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Eco Enthusiast</p>
                      <p className="text-xs text-muted-foreground">Earned 100 green points</p>
                    </div>
                  </div>
                )}
                {profile.total_carbon_footprint >= 50 && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                    <Target className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium text-sm">Carbon Tracker</p>
                      <p className="text-xs text-muted-foreground">Tracked 50kg CO₂e</p>
                    </div>
                  </div>
                )}
                {profile.total_green_points < 10 && profile.total_carbon_footprint < 50 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Start logging activities to unlock achievements!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};