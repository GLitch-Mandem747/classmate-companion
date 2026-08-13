CREATE TABLE public.user_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_access TO authenticated;
GRANT ALL ON public.user_access TO service_role;

ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_access_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_access
    WHERE user_id = _user_id AND role = 'admin' AND is_active
  )
$$;

CREATE POLICY "Users can view their own access row"
ON public.user_access FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_access_admin(auth.uid()));

CREATE POLICY "Users can create their own access row"
ON public.user_access FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Admins can update access rows"
ON public.user_access FOR UPDATE TO authenticated
USING (public.is_access_admin(auth.uid()))
WITH CHECK (public.is_access_admin(auth.uid()));

CREATE TRIGGER update_user_access_updated_at
BEFORE UPDATE ON public.user_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();