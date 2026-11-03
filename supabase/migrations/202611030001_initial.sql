begin;
create extension if not exists pgcrypto;
create table public.app_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<2000000),
 updated_at timestamptz not null default now()
);
create function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();return new;end$$;
create trigger touch_app_states before update on public.app_states for each row execute function public.touch_updated_at();
alter table public.app_states enable row level security;
create policy owner_state on public.app_states for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table public.admin_roles(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_roles enable row level security;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.admin_roles where user_id=auth.uid())$$;
revoke all on function public.is_admin() from public;grant execute on function public.is_admin() to authenticated;
create table public.opportunities(id text primary key,data jsonb not null,published boolean not null default false,updated_at timestamptz not null default now(),
 check(data->>'id'=id),check(data->>'name' is not null),check(not published or (data->>'url' like 'https://%' and data->>'verifiedAt' is not null and data->>'academicYear' is not null and data->>'demo'='false')));
create index opportunities_published on public.opportunities(published);
create trigger touch_opportunities before update on public.opportunities for each row execute function public.touch_updated_at();
alter table public.opportunities enable row level security;
create policy read_published on public.opportunities for select to authenticated using(published or public.is_admin());
create policy admin_catalog on public.opportunities for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.campaigns(id uuid primary key default gen_random_uuid(),opportunity_id text not null references public.opportunities(id) on delete cascade,enabled boolean not null default false,starts_at timestamptz not null,ends_at timestamptz not null,check(ends_at>starts_at));
alter table public.campaigns enable row level security;
create policy admin_campaign on public.campaigns for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.campaign_clicks(id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.campaigns(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,day date not null default current_date,created_at timestamptz not null default now(),unique(campaign_id,user_id,day));
alter table public.campaign_clicks enable row level security;
-- Clicks may only be recorded through validated RPC; users cannot write arbitrary events.
create function public.record_campaign_click(campaign uuid) returns void language plpgsql security definer set search_path=public as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from campaigns where id=campaign and enabled and now() between starts_at and ends_at) then raise exception 'Inactive campaign';end if;
 insert into campaign_clicks(campaign_id,user_id)values(campaign,auth.uid())on conflict do nothing;
end$$;
revoke all on function public.record_campaign_click(uuid) from public;grant execute on function public.record_campaign_click(uuid) to authenticated;
create function public.active_campaigns() returns table(campaign_id uuid,opportunity_id text) language sql security definer set search_path=public as $$select id,opportunity_id from campaigns where auth.uid() is not null and enabled and now() between starts_at and ends_at$$;
revoke all on function public.active_campaigns() from public;grant execute on function public.active_campaigns() to authenticated;
create table public.bank_connections(user_id uuid primary key references auth.users(id) on delete cascade,provider text not null default 'plaid_sandbox',encrypted_token text not null,item_id text unique not null,account_ids text[] not null default '{}',cursor text,status text not null default 'connected',last_sync timestamptz,updated_at timestamptz not null default now());
alter table public.bank_connections enable row level security;
-- Tokens have no client policies; only service-role backend can read/write.
create table public.bank_transactions(id text not null,user_id uuid not null references auth.users(id) on delete cascade,account_id text not null,name text not null,cents bigint not null,currency text not null check(currency='CAD'),date date not null,category text not null default 'Uncategorized',manual_category text,removed boolean not null default false,primary key(user_id,id));
create index bank_transactions_user_date on public.bank_transactions(user_id,date);
alter table public.bank_transactions enable row level security;
create policy owner_read_transactions on public.bank_transactions for select to authenticated using(user_id=auth.uid());
create policy owner_categorize on public.bank_transactions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke update on public.bank_transactions from authenticated;grant update(manual_category) on public.bank_transactions to authenticated;
create table public.usage_limits(user_id uuid not null references auth.users(id) on delete cascade,bucket text not null,window timestamptz not null,count integer not null default 1,primary key(user_id,bucket,window));
alter table public.usage_limits enable row level security;
create function public.consume_limit(who uuid,kind text,max_count integer,window_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$declare n integer; w timestamptz;begin
 w=to_timestamp(floor(extract(epoch from now())/window_seconds)*window_seconds);
 insert into usage_limits(user_id,bucket,window)values(who,kind,w)on conflict(user_id,bucket,window)do update set count=usage_limits.count+1 returning count into n;
 return n<=max_count;
end$$;
revoke all on function public.consume_limit(uuid,text,integer,integer) from public,anon,authenticated;grant execute on function public.consume_limit(uuid,text,integer,integer) to service_role;
create table public.webhook_events(id text primary key,created_at timestamptz not null default now(),status text not null default 'received',attempts integer not null default 0);
alter table public.webhook_events enable row level security;
create function public.admin_metrics() returns jsonb language plpgsql security definer set search_path=public as $$begin
 if not public.is_admin() then raise exception 'Forbidden';end if;
 return jsonb_build_object('catalog_records',(select count(*)from opportunities),'published',(select count(*)from opportunities where published),'expired',(select count(*)from opportunities where data->>'deadline' is not null and data->>'deadline'<to_char(current_date,'YYYY-MM-DD')),'active_campaigns',(select count(*)from campaigns where enabled and now() between starts_at and ends_at),'deduplicated_clicks',(select count(*)from campaign_clicks));
end$$;
revoke all on function public.admin_metrics() from public;grant execute on function public.admin_metrics() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('avatars','avatars',false,2000000,array['image/jpeg','image/png','image/webp'])on conflict(id)do nothing;
create policy avatar_owner_read on storage.objects for select to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_owner_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_owner_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_owner_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
