-- Ensure uniqueness for join and conflict targets
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique') THEN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_user_id_unique') THEN
  ALTER TABLE public.leaderboard ADD CONSTRAINT leaderboard_user_id_unique UNIQUE (user_id);
END IF;
END $$;

-- Add foreign key from leaderboard to profiles to enable PostgREST relationship
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_user_id_fkey'
) THEN
  ALTER TABLE public.leaderboard
  ADD CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id) ON DELETE CASCADE;
END IF;
END $$;

-- Allow public read of display_name when a user has opted into the leaderboard
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Public can view display names for leaderboard profiles'
) THEN
  CREATE POLICY "Public can view display names for leaderboard profiles"
  ON public.profiles
  FOR SELECT
  USING (show_on_leaderboard = true);
END IF;
END $$;

-- Trigger functions to keep profile totals + leaderboard in sync with emissions
CREATE OR REPLACE FUNCTION public.carbon_emissions_after_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_user_totals(NEW.user_id, COALESCE(NEW.carbon_amount,0), COALESCE(NEW.green_points_earned,0));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.carbon_emissions_after_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  carbon_delta numeric;
  points_delta integer;
BEGIN
  carbon_delta := COALESCE(NEW.carbon_amount,0) - COALESCE(OLD.carbon_amount,0);
  points_delta := COALESCE(NEW.green_points_earned,0) - COALESCE(OLD.green_points_earned,0);
  PERFORM public.update_user_totals(NEW.user_id, carbon_delta, points_delta);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.carbon_emissions_after_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_user_totals(OLD.user_id, -COALESCE(OLD.carbon_amount,0), -COALESCE(OLD.green_points_earned,0));
  RETURN OLD;
END;
$$;

-- Create or replace triggers
DROP TRIGGER IF EXISTS trg_carbon_emissions_after_insert ON public.carbon_emissions;
CREATE TRIGGER trg_carbon_emissions_after_insert
AFTER INSERT ON public.carbon_emissions
FOR EACH ROW EXECUTE FUNCTION public.carbon_emissions_after_insert();

DROP TRIGGER IF EXISTS trg_carbon_emissions_after_update ON public.carbon_emissions;
CREATE TRIGGER trg_carbon_emissions_after_update
AFTER UPDATE ON public.carbon_emissions
FOR EACH ROW EXECUTE FUNCTION public.carbon_emissions_after_update();

DROP TRIGGER IF EXISTS trg_carbon_emissions_after_delete ON public.carbon_emissions;
CREATE TRIGGER trg_carbon_emissions_after_delete
AFTER DELETE ON public.carbon_emissions
FOR EACH ROW EXECUTE FUNCTION public.carbon_emissions_after_delete();

-- Backfill: ensure profiles exist for users with emissions and update totals
INSERT INTO public.profiles (user_id, display_name, show_on_leaderboard, total_carbon_footprint, total_green_points)
SELECT e.user_id, 'User', true, COALESCE(SUM(e.carbon_amount),0), COALESCE(SUM(e.green_points_earned),0)
FROM public.carbon_emissions e
LEFT JOIN public.profiles p ON p.user_id = e.user_id
WHERE p.user_id IS NULL
GROUP BY e.user_id
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles p 
SET 
  total_carbon_footprint = COALESCE(e.sum_carbon,0),
  total_green_points = COALESCE(e.sum_points,0),
  updated_at = now()
FROM (
  SELECT user_id, SUM(carbon_amount)::numeric as sum_carbon, SUM(green_points_earned)::int as sum_points
  FROM public.carbon_emissions
  GROUP BY user_id
) e
WHERE p.user_id = e.user_id;

-- Upsert leaderboard from profiles
INSERT INTO public.leaderboard (user_id, total_footprint, total_points, updated_at)
SELECT p.user_id, p.total_carbon_footprint, p.total_green_points, now()
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE SET 
  total_footprint = EXCLUDED.total_footprint,
  total_points = EXCLUDED.total_points,
  updated_at = now();

-- Enable realtime for leaderboard
ALTER TABLE public.leaderboard REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='leaderboard'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
  END IF;
END $$;