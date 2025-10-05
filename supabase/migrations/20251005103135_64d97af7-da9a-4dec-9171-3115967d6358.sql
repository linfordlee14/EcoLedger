-- Fix search_path for trigger functions to prevent security issues
CREATE OR REPLACE FUNCTION public.carbon_emissions_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_totals(NEW.user_id, COALESCE(NEW.carbon_amount,0), COALESCE(NEW.green_points_earned,0));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.carbon_emissions_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_totals(OLD.user_id, -COALESCE(OLD.carbon_amount,0), -COALESCE(OLD.green_points_earned,0));
  RETURN OLD;
END;
$$;