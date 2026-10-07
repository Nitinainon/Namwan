-- Run after the catalog migration on an EMPTY store only.
-- These are editable starter examples, not real affiliate products.
begin;
lock table public.categories, public.products in exclusive mode;
do $$ begin
 if exists(select 1 from public.categories) or exists(select 1 from public.products) then
  raise exception 'มีข้อมูลร้านอยู่แล้ว ไม่เพิ่มตัวอย่างทับข้อมูลเดิม';
 end if;
end $$;

insert into public.categories(id,name,sort_order) values
('aaaaaaaa-aaaa-4aaa-8aaa-000000000001','บ้าน & ไลฟ์สไตล์',0),
('aaaaaaaa-aaaa-4aaa-8aaa-000000000002','บิวตี้ & ดูแลตัวเอง',1),
('aaaaaaaa-aaaa-4aaa-8aaa-000000000003','ของน้องแมว',2),
('aaaaaaaa-aaaa-4aaa-8aaa-000000000004','ของน่ารัก',3);

insert into public.products(id,category_id,name,description,recommendation,price,image_url,affiliate_url,featured,published,sort_order) values
('bbbbbbbb-bbbb-4bbb-8bbb-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','แก้วเซรามิกสำหรับเช้าที่สดใส','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','จิบกาแฟแล้วใจฟู สีละมุนเข้ากับทุกมุมบ้าน',189,'/images/mug.svg','',true,true,0),
('bbbbbbbb-bbbb-4bbb-8bbb-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','กระเป๋าผ้าเพื่อนแมว','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','พกของชิ้นเล็กไปไหนก็สะดวก พร้อมเพื่อนแมวน่ารัก',129,'/images/tote.svg','',true,true,1),
('bbbbbbbb-bbbb-4bbb-8bbb-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','ชามอาหารทรงน่ารักของน้องแมว','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','มุมกินข้าวของเจ้าตัวเล็กก็น่ารักได้',259,'/images/bowl.svg','',true,true,2),
('bbbbbbbb-bbbb-4bbb-8bbb-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-000000000002','กระจกตั้งโต๊ะสีพีช','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','เติมความละมุนให้มุมแต่งตัวในทุกวัน',159,'/images/mirror.svg','',false,true,3),
('bbbbbbbb-bbbb-4bbb-8bbb-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','โคมไฟแสงอุ่นข้างเตียง','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','เปิดไฟนุ่ม ๆ แล้วพักใจหลังวันยาว ๆ',349,'/images/lamp.svg','',false,true,4),
('bbbbbbbb-bbbb-4bbb-8bbb-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','สมุดบันทึกเรื่องเล็ก ๆ','สินค้าตัวอย่างสำหรับจัดหน้าร้าน — แอดมินแก้ไขชื่อ รูป รายละเอียด และลิงก์ซื้อได้','เก็บความคิดดี ๆ และลิสต์ของที่อยากได้',89,'/images/notebook.svg','',false,true,5);
commit;
