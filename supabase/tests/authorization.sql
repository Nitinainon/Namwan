-- Optional smoke test in Supabase SQL Editor AFTER migration.
-- Runs as the editor's owner role, then switches to anon; all fixtures rollback.
begin;
insert into public.categories(id,name) values('33333333-3333-4333-8333-333333333333','หมวดทดสอบ');
insert into public.products(id,name,category_id,affiliate_url,published) values
('44444444-4444-4444-8444-444444444444','ฉบับร่างทดสอบ','33333333-3333-4333-8333-333333333333','https://shopee.co.th/test',false);
do $$ begin
  begin
    delete from public.categories where id='33333333-3333-4333-8333-333333333333';
    raise exception 'FAIL: category deletion was allowed';
  exception when foreign_key_violation then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  if public.is_admin() then raise exception 'FAIL: anon is admin'; end if;
  if exists(select 1 from public.products where id='44444444-4444-4444-8444-444444444444') then raise exception 'FAIL: draft visible'; end if;
  begin
    insert into public.products(name,affiliate_url) values('unauthorized','https://shopee.co.th/test');
    raise exception 'FAIL: anon write allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
-- Expected: completes without exceptions, leaving no test records.
