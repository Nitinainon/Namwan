-- Run once in Supabase SQL Editor. Authorization is enforced at the database.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  sort_order integer not null default 0,
  revision integer not null default 1
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '' check (length(description) <= 5000),
  recommendation text not null default '' check (length(recommendation) <= 2000),
  price numeric(12,2) check (price >= 0),
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://[^/[:space:]]+(/|$)'),
  affiliate_url text not null check (affiliate_url ~ '^https://(shopee\.co\.th|s\.shopee\.co\.th|shope\.ee|shp\.ee)(/|\?|#|$)'),
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create table public.site_settings (
  id text primary key default 'main' check (id = 'main'),
  site_name text not null check (length(trim(site_name)) between 1 and 100),
  tagline text not null default '' check (length(tagline) <= 300),
  introduction text not null default '' check (length(introduction) <= 2000),
  banner_url text not null default '' check (banner_url = '' or banner_url ~ '^https://[^/[:space:]]+(/|$)'),
  affiliate_disclosure text not null default '' check (length(affiliate_disclosure) <= 2000),
  revision integer not null default 1
);
insert into public.site_settings(site_name,tagline,introduction,affiliate_disclosure) values
('แม่น้ำหวานลูก 4','ของน่ารักที่อยากบอกต่อ ♡','ค่อย ๆ เลือกของที่ชอบ แล้วส่งต่อให้คุณ มีทั้งของใช้ประจำวันและความน่ารักเล็ก ๆ ที่ทำให้วันธรรมดาพิเศษขึ้น','ลิงก์บางรายการเป็นลิงก์ affiliate หากคุณซื้อผ่านลิงก์นี้ เราอาจได้รับค่าคอมมิชชัน ราคาและโปรโมชันอาจเปลี่ยนแปลง กรุณาตรวจสอบที่ Shopee ก่อนซื้อ');

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.products, public.categories, public.site_settings from public, anon, authenticated;
grant select on public.products, public.categories, public.site_settings to anon, authenticated;
grant insert, update, delete on public.products, public.categories to authenticated;
grant update on public.site_settings to authenticated;
create policy products_read on public.products for select to anon, authenticated using (published or (select public.is_admin()));
create policy products_admin on public.products for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy settings_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_admin on public.site_settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create function private.bump_revision() returns trigger language plpgsql set search_path = '' as $$
begin new.revision := old.revision + 1; return new; end;
$$;
create trigger products_revision before update on public.products for each row execute function private.bump_revision();
create trigger categories_revision before update on public.categories for each row execute function private.bump_revision();
create trigger settings_revision before update on public.site_settings for each row execute function private.bump_revision();

create function public.save_product(p_id uuid, p_expected_revision integer, p_data jsonb)
returns public.products language plpgsql security invoker set search_path = '' as $$
declare result public.products; current_revision integer;
begin
  if not public.is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน' using errcode='42501'; end if;
  if p_id is null then
    insert into public.products(name,category_id,description,recommendation,price,image_url,affiliate_url,featured,published,sort_order)
    values(trim(p_data->>'name'),nullif(p_data->>'categoryId','')::uuid,coalesce(p_data->>'description',''),coalesce(p_data->>'recommendation',''),nullif(p_data->>'price','')::numeric,coalesce(p_data->>'imageUrl',''),p_data->>'affiliateUrl',coalesce((p_data->>'featured')::boolean,false),coalesce((p_data->>'published')::boolean,false),coalesce((p_data->>'sortOrder')::integer,0)) returning * into result;
  else
    select revision into current_revision from public.products where id=p_id for update;
    if not found then raise exception 'ไม่พบสินค้า' using errcode='P0002'; end if;
    if current_revision is distinct from p_expected_revision then raise exception 'ข้อมูลเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด' using errcode='40001'; end if;
    update public.products set name=trim(p_data->>'name'),category_id=nullif(p_data->>'categoryId','')::uuid,description=coalesce(p_data->>'description',''),recommendation=coalesce(p_data->>'recommendation',''),price=nullif(p_data->>'price','')::numeric,image_url=coalesce(p_data->>'imageUrl',''),affiliate_url=p_data->>'affiliateUrl',featured=coalesce((p_data->>'featured')::boolean,false),published=coalesce((p_data->>'published')::boolean,false),sort_order=coalesce((p_data->>'sortOrder')::integer,0),updated_at=now() where id=p_id returning * into result;
  end if;
  return result;
end;
$$;
create function public.save_category(p_id uuid, p_expected_revision integer, p_data jsonb)
returns public.categories language plpgsql security invoker set search_path = '' as $$
declare result public.categories; current_revision integer;
begin
  if not public.is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน' using errcode='42501'; end if;
  if p_id is null then
    insert into public.categories(name,sort_order) values(trim(p_data->>'name'),coalesce((p_data->>'sortOrder')::integer,0)) returning * into result;
  else
    select revision into current_revision from public.categories where id=p_id for update;
    if not found then raise exception 'ไม่พบหมวดหมู่' using errcode='P0002'; end if;
    if current_revision is distinct from p_expected_revision then raise exception 'ข้อมูลเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด' using errcode='40001'; end if;
    update public.categories set name=trim(p_data->>'name'),sort_order=coalesce((p_data->>'sortOrder')::integer,0) where id=p_id returning * into result;
  end if;
  return result;
end;
$$;
create function public.save_settings(p_expected_revision integer,p_data jsonb)
returns public.site_settings language plpgsql security invoker set search_path = '' as $$
declare result public.site_settings; current_revision integer;
begin
  if not public.is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน' using errcode='42501'; end if;
  select revision into current_revision from public.site_settings where id='main' for update;
  if current_revision is distinct from p_expected_revision then raise exception 'ข้อมูลเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด' using errcode='40001'; end if;
  update public.site_settings set site_name=trim(p_data->>'siteName'),tagline=coalesce(p_data->>'tagline',''),introduction=coalesce(p_data->>'introduction',''),banner_url=coalesce(p_data->>'bannerUrl',''),affiliate_disclosure=coalesce(p_data->>'affiliateDisclosure','') where id='main' returning * into result;
  return result;
end;
$$;
revoke all on function public.save_product(uuid,integer,jsonb),public.save_category(uuid,integer,jsonb),public.save_settings(integer,jsonb) from public,anon;
grant execute on function public.save_product(uuid,integer,jsonb),public.save_category(uuid,integer,jsonb),public.save_settings(integer,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy product_images_read on storage.objects for select to anon,authenticated using (bucket_id='product-images');
create policy product_images_admin on storage.objects for all to authenticated using (bucket_id='product-images' and (select public.is_admin())) with check (bucket_id='product-images' and (select public.is_admin()));
commit;
