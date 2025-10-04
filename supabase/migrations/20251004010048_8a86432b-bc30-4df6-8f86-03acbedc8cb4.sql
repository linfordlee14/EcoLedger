-- Phase 1: Security Improvements

-- Step 1: Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT true;

-- Step 2: Update leaderboard RLS policy to respect privacy
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;

CREATE POLICY "Public leaderboard respects privacy" 
ON public.leaderboard 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = leaderboard.user_id 
    AND profiles.show_on_leaderboard = true
  )
);

-- Step 3: Remove email column from profiles (redundant with auth.users)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email;

-- Step 4: Update handle_new_user trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, show_on_leaderboard)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    true
  );
  RETURN new;
END;
$$;