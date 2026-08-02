-- Create user access control table
CREATE TABLE public.user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access record"
ON public.user_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all access records"
ON public.user_access FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_access admin_access
    WHERE admin_access.user_id = auth.uid()
      AND admin_access.role = 'admin'
      AND admin_access.is_active = true
  )
);

CREATE POLICY "Users can insert their own access record"
ON public.user_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update access records"
ON public.user_access FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_access admin_access
    WHERE admin_access.user_id = auth.uid()
      AND admin_access.role = 'admin'
      AND admin_access.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_access admin_access
    WHERE admin_access.user_id = auth.uid()
      AND admin_access.role = 'admin'
      AND admin_access.is_active = true
  )
);

CREATE POLICY "Users can update their own access record"
ON public.user_access FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX user_access_single_admin_idx
ON public.user_access (role)
WHERE role = 'admin' AND is_active = true;

CREATE TRIGGER update_user_access_updated_at
BEFORE UPDATE ON public.user_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
