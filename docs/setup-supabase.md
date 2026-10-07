# ติดตั้งฐานข้อมูลและแอดมิน

โปรเจกต์: `https://pmqdgnsypfubuwaebefx.supabase.co`

## 1. ติดตั้งตารางและสิทธิ์

เปิดโปรเจกต์ใน Supabase Dashboard → SQL Editor → New query คัดลอกทั้งหมดจาก `supabase/migrations/202610070001_catalog.sql` แล้วกด Run เพียงครั้งเดียว ไฟล์ทำงานใน transaction หากมีข้อผิดพลาดการติดตั้งจะ rollback

จะได้ตาราง `products`, `categories`, `site_settings` และตารางรายชื่อแอดมิน `private.admin_users` พร้อม RLS และ bucket `product-images` เริ่มด้วยข้อมูลหน้าร้าน แต่ไม่มีสินค้า affiliate จริง รอเจ้าของเพิ่มสินค้าเอง

หากมีตารางชื่อเดียวกันอยู่แล้ว อย่าลบเพื่อรันซ้ำ ให้ตรวจและทำ migration ต่อจากสภาพจริงก่อน

## 2. ปิดการสมัครสมาชิกสาธารณะ

ใน Authentication → Settings/Configuration ปิดตัวเลือก Allow new users to sign up เปิด Email/password provider และตั้ง password policy อย่างน้อย 12 ตัวอักษร ชื่อเมนูอาจแตกต่างตามรุ่น Dashboard

เว็บไม่มีหน้าสมัครสมาชิก แต่ต้องปิด signup ใน Supabase ด้วย ผู้ที่สร้างบัญชีได้ก็จะยังไม่มีสิทธิ์แอดมินจนกว่าจะกำหนดในตารางแอดมิน

## 3. สร้างบัญชีแอดมิน

Authentication → Users → Add user → Create new user กรอกอีเมลและรหัสผ่านที่คุณเลือกเอง เปิดยืนยันอีเมลอัตโนมัติสำหรับบัญชีที่คุณสร้างเองถ้ามีตัวเลือกนี้ คุณไม่ต้องส่งรหัสผ่านมาในแชต

คัดลอก User UID ของบัญชีนี้ จากนั้นรัน SQL โดยแทน UUID ตัวอย่างด้วย UID จริง:

```sql
insert into private.admin_users (user_id)
values ('ใส่-User-UID-จริงตรงนี้'::uuid)
on conflict (user_id) do nothing;
```

ตารางนี้ไม่อยู่ใน schema ที่เปิดให้ client เรียก และ client ไม่มีสิทธิ์ให้ตัวเองเป็นแอดมิน

หากต้องถอนสิทธิ์แอดมิน ให้ทำผ่าน SQL Editor:

```sql
delete from private.admin_users
where user_id = 'ใส่-User-UID-ที่ต้องการถอนสิทธิ์'::uuid;
```

การเปลี่ยนแปลงนี้ปฏิเสธการเขียนผ่าน RLS ทันทีแม้ access token เดิมยังไม่หมดอายุ หน้าแอดมินจะตรวจสิทธิ์อีกครั้งเมื่อเปิดหรือโหลดข้อมูล

## 4. ตั้ง API key และโดเมน

Settings → API Keys คัดลอก **Publishable key** (ขึ้นต้น `sb_publishable_`) หรือ legacy `anon` key ใส่ใน `.env.local` และ Netlify environment variables ตาม README ไม่ใช้ secret หรือ service_role key เพราะข้าม RLS ได้

Authentication → URL Configuration ตั้ง Site URL เป็นโดเมน Netlify ที่ได้จริง และ redirect URLs ตามโดเมนที่ใช้ เช่น `https://ชื่อเว็บของคุณ.netlify.app/admin` รวมถึง `http://127.0.0.1:5173/admin` สำหรับพัฒนา

แนะนำกำหนด JWT expiry ให้เหมาะกับงาน เช่น 15 นาที โดย Supabase SDK จะต่ออายุ session ที่ยังใช้งานได้ หากต้องรีเซ็ตรหัสผ่านที่ลืม ให้จัดการผ่าน Dashboard หรือกระบวนการ reset ของ Supabase เว็บรุ่นนี้ไม่มีหน้ากู้รหัสผ่านสาธารณะ

## 5. ตรวจว่าติดตั้งครบ

1. หน้าร้านโหลดได้และเห็นข้อมูลหน้าร้านที่บันทึกไว้
2. `/admin` แสดงหน้าเข้าสู่ระบบ ไม่แสดงรายการสินค้าหลังบ้านก่อนเข้าสู่ระบบ
3. บัญชีแอดมินเข้าสู่ระบบแล้วเพิ่มหมวดหมู่และสินค้าได้
4. สินค้าที่เปิดเผยแพร่ปรากฏในอีก browser/session สินค้าฉบับร่างไม่ปรากฏ
5. อัปโหลดรูป JPG/PNG/WebP และลองไฟล์เกิน 5 MB ที่ควรถูกปฏิเสธ
6. เรียก REST API ด้วย publishable key อย่างเดียวเขียนสินค้าไม่ได้ และไม่ได้เห็นสินค้าฉบับร่าง
7. รัน `supabase/tests/authorization.sql` ถ้าต้องการตรวจ RLS กับหมวดหมู่ในฐานจริง โดยข้อมูลทดสอบจะ rollback

## รูปภาพ

bucket `product-images` เปิดให้อ่านรูปสาธารณะ อนุญาต upload/update/delete เฉพาะแอดมิน รูปในฉบับร่างยังเป็นไฟล์สาธารณะ จึงไม่เก็บเอกสารหรือภาพส่วนตัวใน bucket นี้ รูปเก่าจะไม่ถูกลบอัตโนมัติเมื่อเปลี่ยนหรือลบสินค้า เพื่อไม่ให้กระทบรายการอื่นที่ใช้ URL เดียวกัน
