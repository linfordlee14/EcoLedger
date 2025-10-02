import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EmissionData {
  date: string;
  emissions: number;
  count: number;
}

export const EmissionsChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<EmissionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmissionsData();
    }
  }, [user]);

  const fetchEmissionsData = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_emissions')
        .select('carbon_amount, logged_at')
        .eq('user_id', user?.id)
        .order('logged_at', { ascending: true });

      if (error) throw error;

      // Group emissions by date
      const groupedData: { [key: string]: { emissions: number; count: number } } = {};
      
      data?.forEach((emission) => {
        const date = new Date(emission.logged_at).toLocaleDateString();
        if (!groupedData[date]) {
          groupedData[date] = { emissions: 0, count: 0 };
        }
        groupedData[date].emissions += emission.carbon_amount;
        groupedData[date].count += 1;
      });

      const chartData = Object.entries(groupedData).map(([date, data]) => ({
        date,
        emissions: Number(data.emissions.toFixed(2)),
        count: data.count,
      }));

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching emissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emissions Trend</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emissions Trend</CardTitle>
          <CardDescription>Your carbon footprint over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>No emission data yet</p>
              <p className="text-sm">Start logging activities to see your trend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emissions Trend</CardTitle>
        <CardDescription>Your daily carbon footprint tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="emissions" stroke="#16a34a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};