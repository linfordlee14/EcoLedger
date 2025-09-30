-- Create function to update user totals
CREATE OR REPLACE FUNCTION public.update_user_totals(
  user_id UUID,
  carbon_delta NUMERIC,
  points_delta INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    total_carbon_footprint = GREATEST(0, total_carbon_footprint + carbon_delta),
    total_green_points = GREATEST(0, total_green_points + points_delta),
    updated_at = now()
  WHERE profiles.user_id = update_user_totals.user_id;
  
  -- Update or insert leaderboard entry
  INSERT INTO public.leaderboard (user_id, total_footprint, total_points)
  VALUES (update_user_totals.user_id, 
          (SELECT total_carbon_footprint FROM public.profiles WHERE profiles.user_id = update_user_totals.user_id),
          (SELECT total_green_points FROM public.profiles WHERE profiles.user_id = update_user_totals.user_id))
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_footprint = (SELECT total_carbon_footprint FROM public.profiles WHERE profiles.user_id = update_user_totals.user_id),
    total_points = (SELECT total_green_points FROM public.profiles WHERE profiles.user_id = update_user_totals.user_id),
    updated_at = now();
END;
$$;