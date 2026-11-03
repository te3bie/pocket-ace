begin;
create function public.session_is_verified() returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified'))
$$;
revoke all on function public.session_is_verified() from public;grant execute on function public.session_is_verified() to authenticated;
-- Restrictive policies combine with ownership policies; MFA users must challenge before reading data.
create policy mfa_state on public.app_states as restrictive for all to authenticated using(public.session_is_verified())with check(public.session_is_verified());
create policy mfa_transactions on public.bank_transactions as restrictive for all to authenticated using(public.session_is_verified())with check(public.session_is_verified());
create policy mfa_catalog on public.opportunities as restrictive for all to authenticated using(public.session_is_verified())with check(public.session_is_verified());
create policy mfa_campaigns on public.campaigns as restrictive for all to authenticated using(public.session_is_verified())with check(public.session_is_verified());
create policy mfa_avatars on storage.objects as restrictive for all to authenticated using(bucket_id<>'avatars' or public.session_is_verified())with check(bucket_id<>'avatars' or public.session_is_verified());
commit;
