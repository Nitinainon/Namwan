// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("starter catalog is stored, admin-editable, and cannot overwrite existing data", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant all on storage.objects to anon,authenticated;`);
    await db.exec(await readFile("supabase/migrations/202610070001_catalog.sql", "utf8"));
    const seed = await readFile("supabase/seed.sql", "utf8");
    await db.exec(seed);
    expect((await db.query("select * from public.categories")).rows).toHaveLength(4);
    expect((await db.query("select * from public.products where published and affiliate_url = ''")).rows).toHaveLength(6);
    const admin = "11111111-1111-4111-8111-111111111111";
    await db.exec(`insert into auth.users values ('${admin}'); insert into private.admin_users(user_id) values ('${admin}'); select set_config('request.jwt.claim.sub','${admin}',false); set role authenticated;`);
    const p = (await db.query<any>("select * from public.products order by sort_order limit 1")).rows[0];
    await db.query("select public.save_product($1, $2, $3::jsonb)", [p.id, p.revision, JSON.stringify({ name: "สินค้าที่แอดมินแก้", categoryId: p.category_id, affiliateUrl: "", imageUrl: p.image_url, published: true })]);
    await db.query("select public.save_category($1, 1, $2::jsonb)", [p.category_id, JSON.stringify({ name: "หมวดที่แอดมินแก้", sortOrder: 0 })]);
    expect((await db.query<any>("select name from public.products where id = $1", [p.id])).rows[0].name).toBe("สินค้าที่แอดมินแก้");
    await db.exec("reset role");
    await expect(db.exec(seed)).rejects.toThrow("มีข้อมูลร้านอยู่แล้ว");
    await db.exec("rollback; set role anon;");
    expect((await db.query<any>("select name from public.categories where id = $1", [p.category_id])).rows[0].name).toBe("หมวดที่แอดมินแก้");
  } finally { await db.close(); }
}, 30000);
