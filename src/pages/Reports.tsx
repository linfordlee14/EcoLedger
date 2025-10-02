import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Calendar, TrendingUp, TrendingDown, Leaf, Award, FileText } from "lucide-react";
import { EmissionsChart } from "@/components/EmissionsChart";

interface MonthlyData {
  month: string;
  total_emissions: number;
  activity_count: number;
  avg_daily_emissions: number;
}

interface CategoryBreakdown {
  category_name: string;
  total_emissions: number;
  percentage: number;
}

export const Reports = () => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    total_emissions: 0,
    total_points: 0,
    activity_count: 0
  });
  const [totalStats, setTotalStats] = useState({
    total_emissions: 0,
    total_activities: 0,
    avg_monthly_emissions: 0,
    best_month: "",
    worst_month: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  const fetchReportsData = async () => {
    try {
      // Fetch monthly aggregated data
      const { data: emissions, error: emissionsError } = await supabase
        .from('carbon_emissions')
        .select(`
          carbon_amount,
          logged_at,
          green_points_earned,
          category:activity_categories(name)
        `)
        .eq('user_id', user?.id);

      if (emissionsError) throw emissionsError;

      // Process monthly data and current month data
      const monthlyMap = new Map<string, { total: number; count: number; points: number }>();
      const categoryMap = new Map<string, number>();
      let totalEmissions = 0;
      
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      let currentMonthEmissions = 0;
      let currentMonthPoints = 0;
      let currentMonthCount = 0;

      emissions?.forEach((emission) => {
        const date = new Date(emission.logged_at);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Monthly aggregation
        const existing = monthlyMap.get(monthKey) || { total: 0, count: 0, points: 0 };
        monthlyMap.set(monthKey, {
          total: existing.total + emission.carbon_amount,
          count: existing.count + 1,
          points: existing.points + (emission.green_points_earned || 0)
        });

        // Current month stats
        if (monthKey === currentMonthKey) {
          currentMonthEmissions += emission.carbon_amount;
          currentMonthPoints += emission.green_points_earned || 0;
          currentMonthCount += 1;
        }

        // Category aggregation
        const categoryName = emission.category?.name || 'Unknown';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + emission.carbon_amount);
        
        totalEmissions += emission.carbon_amount;
      });

      // Convert to arrays
      const monthlyArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        total_emissions: data.total,
        activity_count: data.count,
        avg_daily_emissions: data.total / 30 // Rough daily average
      })).sort((a, b) => a.month.localeCompare(b.month));

      const categoryArray = Array.from(categoryMap.entries()).map(([category_name, total_emissions]) => ({
        category_name,
        total_emissions,
        percentage: (total_emissions / totalEmissions) * 100
      })).sort((a, b) => b.total_emissions - a.total_emissions);

      // Calculate stats
      const avgMonthly = monthlyArray.length > 0 ? totalEmissions / monthlyArray.length : 0;
      const bestMonth = monthlyArray.reduce((min, curr) => 
        curr.total_emissions < min.total_emissions ? curr : min, 
        monthlyArray[0] || { month: "", total_emissions: Infinity }
      );
      const worstMonth = monthlyArray.reduce((max, curr) => 
        curr.total_emissions > max.total_emissions ? curr : max, 
        monthlyArray[0] || { month: "", total_emissions: 0 }
      );

      setMonthlyData(monthlyArray);
      setCategoryBreakdown(categoryArray);
      setTotalStats({
        total_emissions: totalEmissions,
        total_activities: emissions?.length || 0,
        avg_monthly_emissions: avgMonthly,
        best_month: bestMonth?.month || "",
        worst_month: worstMonth?.month || ""
      });
      
      setCurrentMonthStats({
        total_emissions: currentMonthEmissions,
        total_points: currentMonthPoints,
        activity_count: currentMonthCount
      });

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <Layout title="Reports" description="Detailed analysis of your carbon footprint">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Generating your reports...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports" description="Detailed analysis of your carbon footprint">
      <div className="space-y-8">
        {/* This Month's Report Card */}
        <div className="bg-card rounded-2xl p-6 shadow-md border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            This Month's Report
          </h2>
          <p className="text-muted-foreground mb-2">
            Total CO₂e: <span className="font-semibold text-destructive">{currentMonthStats.total_emissions.toFixed(1)} kg</span>
          </p>
          <p className="text-muted-foreground mb-2">
            Points Earned: <span className="font-semibold text-primary">{currentMonthStats.total_points} pts</span>
          </p>
          <p className="text-muted-foreground mb-4">
            Activities Logged: <span className="font-semibold text-accent">{currentMonthStats.activity_count}</span>
          </p>
          <button className="mt-4 bg-foreground text-background px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            📄 Export Report
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Emissions</p>
                  <p className="text-2xl font-bold">{totalStats.total_emissions.toFixed(1)} kg</p>
                </div>
                <TrendingUp className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{totalStats.total_activities}</p>
                </div>
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Average</p>
                  <p className="text-2xl font-bold">{totalStats.avg_monthly_emissions.toFixed(1)} kg</p>
                </div>
                <Calendar className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Month</p>
                  <p className="text-sm font-bold text-primary">
                    {totalStats.best_month ? formatMonth(totalStats.best_month) : "N/A"}
                  </p>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emissions Chart */}
          <div className="lg:col-span-2">
            <EmissionsChart />
          </div>

          {/* Monthly Breakdown */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Monthly Breakdown
              </CardTitle>
              <CardDescription>Your emissions by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {monthlyData.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{formatMonth(month.month)}</p>
                      <p className="text-sm text-muted-foreground">{month.activity_count} activities</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{month.total_emissions.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {month.avg_daily_emissions.toFixed(2)} kg/day avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Category Breakdown
              </CardTitle>
              <CardDescription>Emissions by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryBreakdown.map((category) => (
                  <div key={category.category_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{category.category_name}</p>
                      <div className="text-right">
                        <p className="font-bold">{category.total_emissions.toFixed(1)} kg</p>
                        <Badge variant="secondary" className="text-xs">
                          {category.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="gradient-bg h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};