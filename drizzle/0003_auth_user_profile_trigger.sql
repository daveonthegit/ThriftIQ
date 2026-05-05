CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]',
    '_',
    'g'
  ));

  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  END IF;

  final_username := left(base_username, 24);

  BEGIN
    INSERT INTO public.users (supabase_auth_id, email, username)
    VALUES (new.id, lower(new.email), final_username)
    ON CONFLICT (supabase_auth_id) DO UPDATE
      SET email = excluded.email,
          updated_at = now();
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.users (supabase_auth_id, email, username)
    VALUES (
      new.id,
      lower(new.email),
      left(final_username, 17) || '_' || substr(replace(new.id::text, '-', ''), 1, 6)
    )
    ON CONFLICT (supabase_auth_id) DO UPDATE
      SET email = excluded.email,
          updated_at = now();
  END;

  RETURN new;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
