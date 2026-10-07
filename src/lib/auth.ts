import type {Session} from '@supabase/supabase-js';
import {getSupabase} from './supabase';
function db(){const client=getSupabase();if(!client)throw new Error('ยังไม่ได้เชื่อมต่อ Supabase');return client;}
export async function getAdminSession():Promise<Session|null>{
 const client=db();const {data,error}=await client.auth.getSession();if(error)throw error;if(!data.session)return null;
 const verified=await client.auth.getUser();if(verified.error||!verified.data.user)return null;
 const check=await client.rpc('is_admin');if(check.error)throw new Error('ตรวจสิทธิ์ไม่ได้ กรุณาตรวจการติดตั้งฐานข้อมูล');if(check.data!==true)throw new Error('บัญชีนี้ไม่มีสิทธิ์แอดมิน');return data.session;
}
export async function signIn(email:string,password:string):Promise<void>{const {error}=await db().auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอีเมลและรหัสผ่าน');}
export async function signOut():Promise<void>{const {error}=await db().auth.signOut({scope:'local'});if(error)throw new Error('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');}
export async function changePassword(password:string):Promise<void>{if(password.length<12)throw new Error('ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร');const {error}=await db().auth.updateUser({password});if(error)throw new Error('เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง');}
export function subscribeAuth(listener:()=>void):()=>void{const client=getSupabase();if(!client)return()=>{};const {data}=client.auth.onAuthStateChange(()=>{setTimeout(listener,0)});return()=>data.subscription.unsubscribe();}
