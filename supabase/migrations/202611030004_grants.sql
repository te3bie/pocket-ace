begin;
revoke all on public.app_states,public.bank_connections,public.bank_link_sessions,public.bank_transactions,public.admin_roles,public.opportunities,public.campaigns,public.campaign_clicks,public.usage_limits,public.webhook_events from anon;
grant select,insert,update,delete on public.app_states to authenticated;
grant select on public.admin_roles,public.bank_connections,public.bank_link_sessions,public.bank_transactions to authenticated;
grant update(manual_category) on public.bank_transactions to authenticated;
grant select,insert,update,delete on public.opportunities,public.campaigns to authenticated;
revoke insert,update,delete on public.admin_roles,public.bank_connections,public.bank_link_sessions,public.campaign_clicks,public.usage_limits,public.webhook_events from authenticated;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select public.session_is_verified() and exists(select 1 from public.admin_roles where user_id=auth.uid())$$;
commit;
