# Namwan Affiliate Showroom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างโชว์รูมสินค้า Shopee ภาษาไทยบนมือถือ พร้อมหน้า /admin ที่จัดการข้อมูลได้เฉพาะแอดมินผ่าน Supabase

**Architecture:** React/TypeScript/Vite ทำหน้าร้านและโหลดหน้าแอดมินแยกกัน Supabase Auth ตรวจบัญชี, Postgres/RLS ตรวจสิทธิ์ข้อมูล และ Storage policies ตรวจสิทธิ์รูปภาพ Netlify โฮสต์ build แบบ static; ไม่มีรหัสผ่านหรือ service_role key ใน frontend

**Tech Stack:** React, TypeScript, Vite, @supabase/supabase-js, Vitest, Testing Library, PostgreSQL, Netlify

**Spec:** ../specs/2026-10-07-namwan-affiliate-design.md

## Global Constraints

- โฮสต์บน Netlify และเก็บ source code ใน repository Nitinainon/Namwan
- Supabase โปรเจกต์ https://pmqdgnsypfubuwaebefx.supabase.co
- ธีมครีม ชมพูพาสเทล และน้ำตาลอ่อน มีภาพแมวประกอบและมุมโค้ง
- เข้าทาง /admin โดยไม่มีปุ่มหรือลิงก์นี้ในหน้าร้านและไม่ใส่เส้นทางนี้ใน sitemap
- ทุกการเพิ่ม แก้ไข ลบ และอ่านข้อมูลหลังบ้านต้องตรวจ auth.uid() ว่าอยู่ใน admin_users
- ไม่มีหน้าสมัครสมาชิกสาธารณะและปิด public signup
- ไม่ใช้ secret key หรือ service_role key ใน browser หรือไฟล์ที่เผยแพร่
- ไม่มีการชำระเงินบนเว็บ ไม่มีการสร้างลิงก์ affiliate หรือดึงราคา Shopee อัตโนมัติ
- รูปหน้าร้านใช้ public bucket และถือเป็นไฟล์สาธารณะ
- รายงาน URL เว็บจริงหลัง deploy สำเร็จเท่านั้น

## Review Focus

1. ยังไม่มี publishable key: แสดงข้อจำกัดและตัวอย่างอย่างชัดเจน ไม่แสดงว่าบันทึกจริงสำเร็จ (Task 2)
2. บัญชีเข้าสู่ระบบสำเร็จแต่ไม่ได้เป็นแอดมิน: ไม่โหลดข้อมูลหลังบ้าน และ RLS ปฏิเสธการเขียน (Tasks 1, 4)
3. ฟอร์มเก่าจากอีกแท็บ: revision conflict ไม่ทับข้อมูลล่าสุด (Tasks 1, 5)
4. ชื่อไทยยาว ราคา 0 และหมวดไม่มีสินค้า: layout และการกรองยังใช้งานได้ (Tasks 2, 3)
5. Network ล้มเหลวตอนบันทึกหรืออัปโหลด: คงฟอร์มให้ลองใหม่ ไม่ลบรูปเดิมก่อนบันทึกสำเร็จ (Task 5)

## File Structure and Interfaces

- `src/lib/types.ts`: Product, Category, SiteSettings, Catalog, ProductInput, CategoryInput
- `src/lib/supabase.ts`: สร้าง client เมื่อมี config; export `supabase: SupabaseClient | null`
- `src/lib/catalog.ts`: public catalog, admin CRUD และข้อมูลตั้งค่า
- `src/lib/auth.ts`: signIn, signOut, getAdminSession, changePassword
- `src/lib/validation.ts`: ตรวจ URL, input และไฟล์รูป
- `src/App.tsx`, `src/main.tsx`: เลือก public route หรือ lazy admin route
- `src/storefront/Storefront.tsx`, `ProductCard.tsx`, `ProductDetails.tsx`: หน้าร้านและรายละเอียด
- `src/admin/AdminGate.tsx`, `Login.tsx`, `Dashboard.tsx`, `ProductEditor.tsx`, `CategoryEditor.tsx`, `SettingsEditor.tsx`: login/guard และ CRUD
- `src/components/CatMark.tsx`, `StatusMessage.tsx`, `src/styles.css`: ภาพแมว SVG ที่สร้างเอง, feedback และ responsive design
- `supabase/migrations/202610070001_catalog.sql`: schema, grants, RLS, revision trigger, bucket และ atomic RPC
- `supabase/tests/authorization.sql`: ตรวจสิทธิ์โดย transaction/rollback
- `tests/*.test.ts(x)`: validation, repository behavior, storefront, auth gate และ CRUD
- `netlify.toml`, `.env.example`, `.gitignore`, `README.md`: build, routing และคู่มือภาษาไทย

Types ใช้ camelCase ใน UI และแปลง snake_case ที่ data adapter เท่านั้น Product มี id, categoryId, name, description, recommendation, price (number หรือ null), imageUrl, affiliateUrl, featured, published, sortOrder และ revision Category มี id, name, sortOrder, revision SiteSettings มี id='main', siteName, tagline, introduction, bannerUrl, affiliateDisclosure และ revision Catalog มี products, categories, settings

## Task 1: Database and Permissions

**Files:** Create migration และ authorization.sql ตาม File Structure

**Interfaces:** ผลิต public tables products/categories/site_settings และ private.admin_users; RPC `is_admin() -> boolean`, `save_product(p_id uuid, p_expected_revision integer, p_data jsonb) -> products`, `save_category(...) -> categories`, `save_settings(p_expected_revision integer, p_data jsonb) -> site_settings` adapter ใน Task 2 ใช้ RPC เหล่านี้

- [ ] เขียน SQL tests แบบ transaction: anon SELECT ไม่เห็น draft; anon INSERT ถูกปฏิเสธ; authenticated ที่ไม่ได้อยู่ใน private.admin_users UPDATE ถูกปฏิเสธ; admin CRUD สำเร็จ; ถอนสิทธิ์แล้ว UPDATE ถูกปฏิเสธ; DELETE หมวดที่มีสินค้าถูกปฏิเสธ; stale revision บันทึกไม่ได้
- [ ] รัน tests ก่อน migration บนฐานทดสอบ: expected relation/function missing หากยังไม่มี database access ระบุว่าไม่ได้รัน ห้ามอ้างว่าผ่าน
- [ ] สร้าง schema: UUID, foreign key category_id ON DELETE RESTRICT, price >= 0, revision default 1, fields ที่จำเป็น NOT NULL, ลำดับ integer และ constraints URL/ความยาว
- [ ] เปิด RLS ทุก public table; anon/authenticated อ่าน published products, categories, public settings ได้; admin อ่าน drafts และ CRUD ได้ ใช้ private.admin_users ที่ client อ่าน/เขียนไม่ได้กับ security definer is_admin ที่กำหนด search_path และ grants อย่างชัดเจน
- [ ] สร้าง atomic save RPC ด้วย row lock ตรวจ revision และตรวจ admin ก่อนการเขียน; trigger เพิ่ม revision ให้การแก้จาก Dashboard ก็ตรวจ conflict ได้ด้วย จำกัด execute privileges
- [ ] สร้าง public bucket `product-images`, รับ JPEG/PNG/WebP ไม่เกิน 5 MiB; INSERT/UPDATE/DELETE เฉพาะ admin ห้าม client แก้ bucket configuration
- [ ] รัน SQL tests หลัง migration: expected ทุก assertion ผ่านและ rollback ถ้าเข้า Supabase จริงไม่ได้ จัดเตรียม script และรายงานข้อจำกัด
- [ ] Commit migration และ tests

## Task 2: Data Layer, Validation and Project Setup

**Files:** Create package.json, lockfile, index.html, vite.config.ts, tsconfig files, src/lib/*, src/demo/catalog.ts, .env.example, .gitignore, tests/validation.test.ts, tests/catalog.test.ts

**Interfaces:** `loadCatalog(): Promise<Catalog>`, `loadAdminCatalog(): Promise<Catalog>`, `saveProduct(input: ProductInput, id?: string, expectedRevision?: number): Promise<Product>`, `deleteProduct(id: string): Promise<void>`, equivalent save/deleteCategory, `saveSettings(input: SiteSettings): Promise<SiteSettings>`, `uploadImage(file: File): Promise<string>`, `validateProduct(input: ProductInput): Record<string,string>`

- [ ] ตั้ง scripts `dev`, `build` (tsc + vite build), `test` (vitest run); install dependencies โดยไม่เพิ่ม backend service อื่น
- [ ] เขียน tests: affiliate URL https://shopee.co.th/ และ https://s.shopee.co.th/ ถูกยอมรับ; http/javascript URL และ fake hostname เช่น shopee.co.th.evil.test ถูกปฏิเสธ; price 0 ผ่านและติดลบไม่ผ่าน; SVG และรูปเกิน 5 MiB ไม่ผ่าน
- [ ] เขียน repository tests: missing config ไม่อนุญาต write; backend error ไม่แปลงเป็น success; revision conflict ส่ง error ที่ UI แยกได้; affiliate URL ไม่ถูกแก้ query หรือ tracking
- [ ] รัน `npm.cmd test`: expected fail เพราะ functions ยังไม่มี
- [ ] Implement types/client/adapter/validation และ demo ที่ระบุว่าเป็นตัวอย่าง ใช้ project URL ที่ให้มาและ key จาก env เท่านั้น ไม่ใส่ fabricated key; draft ตัวอย่างไม่แสดงต่อสาธารณะ
- [ ] รัน `npm.cmd test`: expected pass; `npm.cmd run build` expected TypeScript/build ผ่าน
- [ ] Commit data layer และ config

## Task 3: Mobile Storefront

**Files:** Create main.tsx, App.tsx, storefront/*, components/*, styles.css, tests/storefront.test.tsx

**Interfaces:** `Storefront(): JSX.Element` เรียก loadCatalog; `ProductCard({product,onSelect})`, `ProductDetails({product,onClose})` ใช้ types ของ Task 2

- [ ] เขียน tests: ค้นหาชื่อไทยและคำแนะนำได้; หมวดไม่มีสินค้าแสดง empty state; draft ไม่แสดง; featured แสดงแยก; link เปิด affiliate URL เดิมและมี rel='sponsored noopener noreferrer'; ไม่มีลิงก์ /admin ในหน้าร้าน; backend failure แสดง retry
- [ ] รัน tests ให้เห็น failure ก่อน implementation
- [ ] Implement storefront: hero แมว, search, category chips, featured products, grid, detail dialog และ affiliate disclosure; ใช้ข้อความไทยและชื่อเริ่มต้น “น้ำหวานคัดให้” รองรับชื่อยาว/ราคา null/ราคา 0 แสดงอายุราคาว่าโดยประมาณ
- [ ] ทำ responsive ที่ 375px, 768px และ desktop; keyboard focus, labelled inputs, image alt, loading/empty/error states และปิด dialog ด้วย Escape พร้อมคืน focus
- [ ] รัน tests expected pass; ตรวจ preview ที่ 375px ว่าไม่มี horizontal overflow และปุ่มกดใช้งานได้
- [ ] Commit storefront

## Task 4: Password Login and Admin Gate

**Files:** Create lib/auth.ts, admin/AdminGate.tsx, admin/Login.tsx, tests/admin-gate.test.tsx; Modify App.tsx

**Interfaces:** `signIn(email: string,password: string): Promise<void>`, `signOut(): Promise<void>`, `getAdminSession(): Promise<Session|null>`, `changePassword(password: string): Promise<void>`; AdminGate โหลด Dashboard เฉพาะเมื่อ Auth และ is_admin RPC ผ่าน

- [ ] เขียน tests: ไม่มี session แสดงเฉพาะ login; รหัสผิดไม่เปิด dashboard; valid session + is_admin=false ไม่เรียก loadAdminCatalog; network ตอนตรวจสิทธิ์ปฏิเสธ access; session หมดอายุ/ออกจากระบบล้างข้อมูลหลังบ้าน
- [ ] รัน tests expected failure
- [ ] Implement email/password ด้วย signInWithPassword; ตรวจ role ฝั่ง DB ทุกครั้งที่เข้าสู่ gate; แสดงข้อความผิดพลาดทั่วไป ไม่สร้าง signup flow; subscribe auth changes โดยยกเลิก subscription ตอน unmount และไม่โหลดซ้อน
- [ ] Lazy load dashboard เมื่อ guard ผ่าน เพิ่ม noindex และ robots exclusion สำหรับ /admin คู่มือระบุว่าการซ่อนลิงก์ไม่ใช่ตัวตรวจสิทธิ์
- [ ] รัน tests expected pass; ทดสอบ anonymous/admin/non-admin REST ตาม SQL tests ของ Task 1 หากมี credentials
- [ ] Commit auth/guard

## Task 5: Admin CRUD and Site Settings

**Files:** Create admin/Dashboard.tsx, ProductEditor.tsx, CategoryEditor.tsx, SettingsEditor.tsx, tests/admin-crud.test.tsx

**Interfaces:** Dashboard ใช้ loadAdminCatalog และ mutations จาก Task 2, แยก tabs สินค้า/หมวดหมู่/หน้าร้าน; editors รับ record, onSave, onCancel; form payloads ตาม types ใน Task 2

- [ ] เขียน tests: product create/edit/delete ผ่าน adapter ด้วย ID/revision ถูกต้อง; ชื่อ/URL invalid ไม่ส่ง mutation; category มีสินค้าไม่ลบ; stale revision แสดงให้โหลดข้อมูลล่าสุด; save/upload failure คง input; double submit ส่งเพียงครั้งเดียว; cancel delete ไม่เรียก API; settings save เปลี่ยน public catalog หลัง reload
- [ ] รัน tests expected failure
- [ ] Implement editors ครบ fields และ preview รูป; upload สำเร็จก่อนบันทึก record ไม่ลบรูปเดิมก่อน save สำเร็จ; retry/validation/status ไทย; delete confirmation แสดงชื่อสินค้า; sorting และ published/featured toggles
- [ ] Implement settings ชื่อ/คำโปรย/ข้อความแนะนำ/แบนเนอร์/disclosure และเปลี่ยนรหัสผ่าน พร้อม logout บนมือถือ
- [ ] รัน tests expected pass; ทดสอบ CRUD ด้วยบัญชี admin จริงและโหลดข้อมูลจากอีก session เมื่อพร้อมเชื่อม Supabase
- [ ] Commit admin CRUD

## Task 6: Netlify Packaging, Setup Guide and Final Verification

**Files:** Create netlify.toml, public/robots.txt, README.md, docs/setup-supabase.md; update spec status และ plan checkboxes ตามสิ่งที่ทำจริง

**Interfaces:** Build command `npm run build`, publish `dist`; SPA fallback /admin และหน้าร้าน; env VITE_SUPABASE_URL กับ VITE_SUPABASE_PUBLISHABLE_KEY

- [ ] เขียนคู่มือไทยสำหรับ migration, public key, Auth signup disable, admin user creation + private.admin_users, Auth URL, JWT expiry, storage และ Netlify Git deployment ใช้ตัวอย่าง placeholder อีเมล/UUID โดยไม่ขอรหัสผ่านในแชต
- [ ] ตั้ง headers noindex สำหรับ /admin, security headers และ CSP ให้ Supabase requests/รูปทำงานได้; ไม่ cache auth data ใน service worker และไม่สร้าง service worker
- [ ] รัน `npm.cmd test`, `npm.cmd run build`, `git diff --check`: expected ผ่านทั้งหมด ตรวจ dist ไม่มี secret/service_role และหน้าร้านไม่มี admin link
- [ ] ตรวจ browser ที่ mobile/desktop: search/filter/detail/login/logout/CRUD เมื่อมี database credentials; รายงานสิ่งที่ตรวจไม่ได้แยกจากผล build
- [ ] รีวิวทั้ง branch ว่าครอบคลุม spec โดยเฉพาะ database authorization, revision และ mutation error paths แล้วแก้ข้อผิดพลาดที่พบ
- [ ] ตั้ง remote ไป https://github.com/Nitinainon/Namwan.git หากตรวจยืนยันว่าเป็น repo ผู้ใช้และสิทธิ์พร้อม จากนั้น push branch สำหรับ review; หาก publish/deploy ได้ให้ deploy และตรวจ URL จริง หากขาดสิทธิ์ส่งมอบ source, SQL และคู่มือพร้อมบอกสิ่งที่เหลือ
- [ ] Commit packaging/docs และส่งมอบผลพร้อมสถานะ Supabase/Netlify ที่ทำได้จริง

## Execution Choice

แนะนำ Native: implement ในแชตนี้ทีละ task เพราะ UI/data/auth ใช้ interfaces ร่วมกันและมีหก task จากนั้นให้ reviewer ตรวจทั้ง branch ก่อนส่งมอบ อีกทางเลือกคือ Subagent-driven ซึ่งแยก implementer/reviewer ในแต่ละ task และใช้บริบทเพิ่ม ผู้ใช้ตรวจแผนและเลือกวิธีก่อนเริ่มเขียน product code ตาม Superpowers
