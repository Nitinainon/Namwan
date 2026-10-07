import type { Product,ProductInput } from './types';
export function isAffiliateUrl(value:string):boolean {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&['shopee.co.th','s.shopee.co.th','shope.ee','shp.ee'].includes(url.hostname);}catch{return false;}
}
export function isImageUrl(value:string):boolean {try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validateProduct(input:Partial<ProductInput>):Record<string,string> {
  const errors:Record<string,string>={};
  if(!input.name?.trim()||input.name.trim().length>200)errors.name='กรอกชื่อสินค้า 1–200 ตัวอักษร';
  if(!isAffiliateUrl(input.affiliateUrl||''))errors.affiliateUrl='ใช้ลิงก์ HTTPS ของ Shopee หรือลิงก์สั้น Shopee';
  if(input.price!=null&&(!Number.isFinite(input.price)||input.price<0||input.price>9999999999.99))errors.price='ราคาอยู่ระหว่าง 0 ถึง 9,999,999,999.99 บาท';
  if(input.imageUrl&&!isImageUrl(input.imageUrl))errors.imageUrl='ลิงก์รูปต้องขึ้นต้นด้วย https://';
  if((input.description?.length||0)>5000)errors.description='รายละเอียดไม่เกิน 5,000 ตัวอักษร';
  if((input.recommendation?.length||0)>2000)errors.recommendation='คำแนะนำไม่เกิน 2,000 ตัวอักษร';
  if(input.sortOrder!==undefined&&!Number.isSafeInteger(input.sortOrder))errors.sortOrder='ลำดับต้องเป็นจำนวนเต็ม';
  return errors;
}
export function validateImage(file:File):string {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'เลือกไฟล์ JPG, PNG หรือ WebP';
  if(file.size===0||file.size>5242880)return 'รูปภาพต้องมีขนาดไม่เกิน 5 MB และไม่เป็นไฟล์ว่าง';
  return '';
}
export function filterProducts(products:Product[],query:string,categoryId:string):Product[] {
  const q=query.trim().toLocaleLowerCase('th');
  return products.filter(p=>p.published&&(!categoryId||p.categoryId===categoryId)&&(!q||`${p.name} ${p.description||''} ${p.recommendation}`.toLocaleLowerCase('th').includes(q))).sort((a,b)=>a.sortOrder-b.sortOrder);
}
export function errorMessage(error:unknown):string {return error instanceof Error?error.message:'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง';}
