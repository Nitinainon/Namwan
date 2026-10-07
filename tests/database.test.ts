// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, test, expect } from "vitest";
let db: PGlite;
const admin = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant all on storage.objects to anon,authenticated;`,
  );
  const migration = await readFile(
    "supabase/migrations/202610070001_catalog.sql",
    "utf8",
  );
  await db.exec(migration);
  await db.exec(
    `insert into auth.users values ('${admin}'),('${other}'); insert into private.admin_users(user_id) values ('${admin}');`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
async function role(name: string, uid = "") {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${uid}',false); set role ${name};`,
  );
}
test("database rejects anonymous and non-admin writes; only published data is public", async () => {
  await role("authenticated", admin);
  const { rows } = await db.query<any>(
    `select (public.save_product(null,null,'{"name":"แมว","affiliateUrl":"https://s.shopee.co.th/example","published":false}'::jsonb)).*`,
  );
  const id = rows[0].id;
  await role("anon");
  expect((await db.query("select * from public.products")).rows).toHaveLength(
    0,
  );
  await expect(
    db.exec(
      `insert into public.products(name,affiliate_url) values ('bad','https://shopee.co.th/test')`,
    ),
  ).rejects.toThrow();
  await expect(
    db.exec(
      `select public.save_product(null,null,'{"name":"bad","affiliateUrl":"https://shopee.co.th/test"}')`,
    ),
  ).rejects.toThrow();
  await role("authenticated", other);
  expect(
    (await db.query<any>("select public.is_admin() as allowed")).rows[0]
      .allowed,
  ).toBe(false);
  await expect(
    db.exec(
      `select public.save_product('${id}',1,'{"name":"hacked","affiliateUrl":"https://shopee.co.th/test"}')`,
    ),
  ).rejects.toThrow();
  await expect(
    db.exec(`insert into private.admin_users(user_id) values ('${other}')`),
  ).rejects.toThrow();
  await role("authenticated", admin);
  await db.exec(
    `select public.save_product('${id}',1,'{"name":"เผยแพร่","affiliateUrl":"https://s.shopee.co.th/example","published":true,"price":0}')`,
  );
  await expect(
    db.exec(
      `select public.save_product('${id}',1,'{"name":"stale","affiliateUrl":"https://shopee.co.th/test"}')`,
    ),
  ).rejects.toThrow("ข้อมูลเปลี่ยน");
  await role("anon");
  expect(
    (await db.query<any>("select name,price from public.products")).rows,
  ).toEqual([{ name: "เผยแพร่", price: "0.00" }]);
});
test("categories cannot be removed while referenced and malformed values are rejected", async () => {
  await role("authenticated", admin);
  const { rows } = await db.query<any>(
    `select (public.save_category(null,null,'{"name":"ของใช้"}')).*`,
  );
  const cat = rows[0].id;
  await db.exec(
    `select public.save_product(null,null,'{"name":"สินค้า","affiliateUrl":"https://shopee.co.th/test","categoryId":"${cat}"}')`,
  );
  await expect(
    db.exec(`delete from public.categories where id='${cat}'`),
  ).rejects.toThrow();
  await expect(
    db.exec(
      `select public.save_product(null,null,'{"name":"bad","affiliateUrl":"https://shopee.co.th.evil.test/test"}')`,
    ),
  ).rejects.toThrow();
  await expect(
    db.exec(
      `select public.save_product(null,null,'{"name":"bad","price":-1,"affiliateUrl":"https://shopee.co.th/test"}')`,
    ),
  ).rejects.toThrow();
});
test("settings compare revisions atomically and non-admin storage mutation is rejected", async () => {
  await role("authenticated", admin);
  await db.exec(
    `select public.save_settings(1,'{"siteName":"ชื่อใหม่","tagline":"hello"}')`,
  );
  await expect(
    db.exec(`select public.save_settings(1,'{"siteName":"ชื่อเก่า"}')`),
  ).rejects.toThrow("ข้อมูลเปลี่ยน");
  await db.exec(
    `insert into storage.objects(bucket_id,name) values ('product-images','test.webp')`,
  );
  await role("authenticated", other);
  await expect(
    db.exec(
      `insert into storage.objects(bucket_id,name) values ('product-images','bad.webp')`,
    ),
  ).rejects.toThrow();
  expect(
    (await db.query("delete from storage.objects returning *")).rows,
  ).toHaveLength(0);
});
test("revoking admin membership rejects writes even with an existing uid", async () => {
  await db.exec(
    `reset role; delete from private.admin_users where user_id='${admin}';`,
  );
  await role("authenticated", admin);
  await expect(
    db.exec(`select public.save_settings(2,'{"siteName":"hacked"}')`),
  ).rejects.toThrow();
});
