import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface ActivityCategory {
  id: string;
  name: string;
  description: string;
  emission_factor: number;
  unit: string;
}

interface ActivityLoggerProps {
  onBack: () => void;
  onActivityLogged: () => void;
}

export const ActivityLogger = ({ onBack, onActivityLogged }: ActivityLoggerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [calculatingAI, setCalculatingAI] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateAIEmissions = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of your activity for AI calculation.",
        variant: "destructive",
      });
      return;
    }

    setCalculatingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-carbon', {
        body: { 
          description: description,
          type: 'ai_estimate'
        }
      });

      if (error) throw error;

      if (data?.carbon_amount) {
        // Find a general category for AI-calculated emissions
        const generalCategory = categories.find(cat => cat.name.includes('Transportation'));
        if (generalCategory) {
          setSelectedCategory(generalCategory.id);
          // Calculate equivalent quantity based on emission factor
          const equivalentQuantity = data.carbon_amount / generalCategory.emission_factor;
          setQuantity(equivalentQuantity.toFixed(2));
        }

        toast({
          title: "AI calculation complete!",
          description: `Estimated ${data.carbon_amount.toFixed(2)} kg CO₂e for your activity.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "AI calculation failed",
        description: error.message || "Could not calculate emissions with AI.",
        variant: "destructive",
      });
    } finally {
      setCalculatingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !quantity || !description) return;

    setLoading(true);
    try {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (!category) throw new Error('Category not found');

      const carbonAmount = parseFloat(quantity) * category.emission_factor;
      const greenPoints = category.name.includes('Recycling') ? Math.abs(Math.round(carbonAmount * 10)) : 0;

      const { error } = await supabase
        .from('carbon_emissions')
        .insert({
          user_id: user?.id,
          category_id: selectedCategory,
          activity_description: description,
          quantity: parseFloat(quantity),
          carbon_amount: carbonAmount,
          green_points_earned: greenPoints,
        });

      if (error) throw error;

      // Update user profile totals
      try {
        const { error: profileError } = await supabase.rpc('update_user_totals', {
          user_id: user?.id,
          carbon_delta: carbonAmount,
          points_delta: greenPoints
        });

        if (profileError) {
          console.error('Error updating profile totals:', profileError);
        }
      } catch (rpcError) {
        console.error('RPC function error:', rpcError);
      }

      onActivityLogged();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log Carbon Activity</CardTitle>
            <CardDescription>
              Track your daily activities and their environmental impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Description</label>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Describe your activity (e.g., 'Drove 25 miles to work', 'Used 150 kWh electricity', 'Recycled 5kg of paper')"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateAIEmissions}
                    disabled={calculatingAI || !description.trim()}
                    className="shrink-0"
                  >
                    {calculatingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Calculate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Describe your activity and use AI to estimate emissions, or manually select a category below.
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategoryData && (
                  <p className="text-xs text-gray-500">
                    {selectedCategoryData.description} • {selectedCategoryData.emission_factor} kg CO₂e per {selectedCategoryData.unit}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Quantity {selectedCategoryData && `(${selectedCategoryData.unit})`}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              {/* Carbon Calculation Preview */}
              {selectedCategoryData && quantity && (
                <div className="p-4 bg-green-50 rounded-lg border">
                  <p className="text-sm font-medium text-green-800">Estimated Impact</p>
                  <p className="text-lg font-bold text-green-900">
                    {(parseFloat(quantity || '0') * selectedCategoryData.emission_factor).toFixed(2)} kg CO₂e
                  </p>
                  {selectedCategoryData.name.includes('Recycling') && (
                    <p className="text-sm text-green-600">
                      +{Math.abs(Math.round((parseFloat(quantity || '0') * selectedCategoryData.emission_factor) * 10))} Green Points for eco-friendly action!
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};