-- Add issue_type and urgency to pothole_reports table
ALTER TABLE public.pothole_reports 
ADD COLUMN IF NOT EXISTS issue_type text DEFAULT 'pothole',
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'medium';

-- Add credits and medals to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolved_reports integer DEFAULT 0;

-- Create medals table
CREATE TABLE IF NOT EXISTS public.user_medals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_type text NOT NULL,
  awarded_at timestamp with time zone DEFAULT now(),
  credits_at_award integer NOT NULL
);

ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_medals
CREATE POLICY "Users can view their own medals"
ON public.user_medals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medals"
ON public.user_medals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to award credits and update stats
CREATE OR REPLACE FUNCTION public.award_credits_for_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award 10 credits for new report
  UPDATE public.profiles
  SET credits = credits + 10,
      total_reports = total_reports + 1
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Function to award credits when issue is resolved
CREATE OR REPLACE FUNCTION public.award_credits_for_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
  medal_threshold integer;
BEGIN
  -- Check if status changed to 'resolved'
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    -- Award 10 more credits
    UPDATE public.profiles
    SET credits = credits + 10,
        resolved_reports = resolved_reports + 1
    WHERE user_id = NEW.user_id
    RETURNING credits INTO current_credits;
    
    -- Check if user should get a medal (every 100 credits)
    medal_threshold := (current_credits / 100) * 100;
    
    IF medal_threshold > 0 AND current_credits >= medal_threshold THEN
      -- Check if medal already awarded for this threshold
      IF NOT EXISTS (
        SELECT 1 FROM public.user_medals 
        WHERE user_id = NEW.user_id 
        AND credits_at_award = medal_threshold
      ) THEN
        INSERT INTO public.user_medals (user_id, medal_type, credits_at_award)
        VALUES (
          NEW.user_id,
          CASE
            WHEN medal_threshold >= 500 THEN 'platinum'
            WHEN medal_threshold >= 300 THEN 'gold'
            WHEN medal_threshold >= 200 THEN 'silver'
            ELSE 'bronze'
          END,
          medal_threshold
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Triggers for credit system
DROP TRIGGER IF EXISTS award_credits_on_report ON public.pothole_reports;
CREATE TRIGGER award_credits_on_report
AFTER INSERT ON public.pothole_reports
FOR EACH ROW
EXECUTE FUNCTION public.award_credits_for_report();

DROP TRIGGER IF EXISTS award_credits_on_resolution ON public.pothole_reports;
CREATE TRIGGER award_credits_on_resolution
AFTER UPDATE ON public.pothole_reports
FOR EACH ROW
EXECUTE FUNCTION public.award_credits_for_resolution();