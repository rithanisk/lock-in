-- Fix signup trigger context by using explicit schema and search_path
-- so inserts work reliably when called from auth.users trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    100
  );

  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (NEW.id, 100, 'welcome_bonus', 'Welcome to LockIn! Here are your starting LockCoins.');

  RETURN NEW;
END;
$$;
