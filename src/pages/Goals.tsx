import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, Plus, Zap, Calendar, TrendingDown } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: string;
  created_at: string;
}

export const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    target_amount: "",
    target_date: "",
    goal_type: "reduction"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const result = await (supabase as any)
        .from('carbon_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      setGoals((result.data || []) as Goal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load your goals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount || !newGoal.target_date) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('carbon_goals')
        .insert({
          user_id: user?.id,
          title: newGoal.title,
          target_amount: parseFloat(newGoal.target_amount),
          target_date: newGoal.target_date,
          goal_type: newGoal.goal_type,
          current_amount: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal created successfully!",
      });

      setNewGoal({ title: "", target_amount: "", target_date: "", goal_type: "reduction" });
      setShowCreateForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal.",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    if (goal.goal_type === "reduction") {
      return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    }
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Layout title="Goals" description="Set and track your carbon reduction targets">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your goals...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Goals" description="Set and track your carbon reduction targets">
      <div className="space-y-8">
        {/* Create Goal Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gradient-bg hover-lift"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? "Cancel" : "Create Goal"}
          </Button>
        </div>

        {/* Create Goal Form */}
        {showCreateForm && (
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Create New Goal
              </CardTitle>
              <CardDescription>Set a new carbon reduction or sustainability target</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Reduce monthly carbon footprint by 20%"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Target Amount (kg CO₂e)</Label>
                  <Input
                    id="target"
                    type="number"
                    placeholder="50"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Target Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={createGoal} className="w-full">
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const daysRemaining = getDaysRemaining(goal.target_date);
              const isExpired = daysRemaining < 0;
              const isCompleted = progress >= 100;

              return (
                <Card key={goal.id} className="card-enhanced hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                      <Badge variant={isCompleted ? "default" : isExpired ? "destructive" : "secondary"}>
                        {isCompleted ? "Completed" : isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{goal.current_amount.toFixed(1)} / {goal.target_amount} kg CO₂e</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% complete</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {isExpired 
                            ? `Expired ${Math.abs(daysRemaining)} days ago`
                            : `${daysRemaining} days remaining`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-primary" />
                        <span className="capitalize">{goal.goal_type}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-enhanced">
            <CardContent className="text-center py-16">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Goals Set</h3>
              <p className="text-muted-foreground mb-6">
                Create your first carbon reduction goal to start tracking your progress
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="gradient-bg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};