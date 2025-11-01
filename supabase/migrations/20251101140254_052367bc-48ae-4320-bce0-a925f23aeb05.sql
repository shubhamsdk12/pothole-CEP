-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pothole_reports_user_id_fkey'
  ) THEN
    ALTER TABLE public.pothole_reports
      ADD CONSTRAINT pothole_reports_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_medals_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_medals
      ADD CONSTRAINT user_medals_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;