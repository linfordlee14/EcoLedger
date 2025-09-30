-- Create user profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    email text,
    total_carbon_footprint numeric DEFAULT 0,
    total_green_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create activity categories table
CREATE TABLE public.activity_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    emission_factor numeric NOT NULL, -- CO2e per unit
    unit text NOT NULL, -- miles, kwh, etc.
    created_at timestamp with time zone DEFAULT now()
);

-- Create carbon emissions table
CREATE TABLE public.carbon_emissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.activity_categories(id),
    activity_description text NOT NULL,
    quantity numeric NOT NULL,
    carbon_amount numeric NOT NULL, -- calculated CO2e amount
    green_points_earned integer DEFAULT 0,
    logged_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rank integer,
    total_footprint numeric DEFAULT 0,
    total_points integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for activity_categories (public read)
CREATE POLICY "Anyone can view activity categories" ON public.activity_categories
    FOR SELECT USING (true);

-- RLS Policies for carbon_emissions
CREATE POLICY "Users can view their own emissions" ON public.carbon_emissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emissions" ON public.carbon_emissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emissions" ON public.carbon_emissions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leaderboard (public read)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
    FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON public.leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default activity categories
INSERT INTO public.activity_categories (name, description, emission_factor, unit) VALUES
('Transportation - Car', 'Driving a gasoline car', 0.411, 'miles'),
('Transportation - Flight', 'Domestic flight', 0.255, 'miles'),
('Energy - Electricity', 'Home electricity usage', 0.92, 'kwh'),
('Energy - Natural Gas', 'Home heating with natural gas', 5.3, 'therms'),
('Food - Meat', 'Red meat consumption', 27.0, 'kg'),
('Food - Dairy', 'Dairy products consumption', 3.2, 'kg'),
('Waste - Recycling', 'Recycling waste (negative emissions)', -0.85, 'kg');