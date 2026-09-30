revoke execute on function public.handle_new_kosmate_user() from public, anon, authenticated;
revoke execute on function public.is_kosmate_support() from public, anon;
grant execute on function public.is_kosmate_support() to authenticated;
