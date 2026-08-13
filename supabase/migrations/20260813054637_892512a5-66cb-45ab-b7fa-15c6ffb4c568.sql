REVOKE EXECUTE ON FUNCTION public.is_access_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_access_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_access_admin(uuid) TO authenticated;