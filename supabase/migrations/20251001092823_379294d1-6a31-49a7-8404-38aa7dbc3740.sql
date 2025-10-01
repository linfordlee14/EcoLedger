-- Create carbon_goals table
CREATE TABLE public.carbon_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'reduction',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on carbon_goals
ALTER TABLE public.carbon_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carbon_goals
CREATE POLICY "Users can view their own goals" 
ON public.carbon_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.carbon_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.carbon_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.carbon_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create carbon_nfts table
CREATE TABLE public.carbon_nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL UNIQUE,
  carbon_amount NUMERIC NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_hash TEXT NOT NULL,
  blockchain_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on carbon_nfts
ALTER TABLE public.carbon_nfts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carbon_nfts
CREATE POLICY "Users can view their own NFTs" 
ON public.carbon_nfts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NFTs" 
ON public.carbon_nfts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create blockchain_rewards table
CREATE TABLE public.blockchain_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_amount INTEGER NOT NULL,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT,
  reward_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blockchain_rewards
ALTER TABLE public.blockchain_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blockchain_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.blockchain_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards" 
ON public.blockchain_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for carbon_goals updated_at
CREATE TRIGGER update_carbon_goals_updated_at
BEFORE UPDATE ON public.carbon_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();