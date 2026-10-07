import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
function db() {
  const client = getSupabase();
  if (!client) throw new Error("ยังไม่ได้เชื่อมต่อ Supabase");
  return client;
}
export async function getAdminSession(): Promise<Session | null> {
  const client = db();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  const verified = await client.auth.getUser();
  if (
    verified.error ||
    !verified.data.user ||
    verified.data.user.id !== data.session.user.id
  )
    return null;
  const check = await client.rpc("is_admin");
  if (check.error)
    throw new Error("ตรวจสิทธิ์ไม่ได้ กรุณาตรวจการติดตั้งฐานข้อมูล");
  if (check.data !== true) throw new Error("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
  return data.session;
}
export async function signIn(username: string, password: string): Promise<void> {
  const identifier = username.trim().toLowerCase();
  const email = identifier.includes("@") ? identifier : `${identifier}@admin.numwan.netlify.app`;
  const { error } = await db().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจยูเซอร์และรหัสผ่าน");
}
export async function signOut(): Promise<void> {
  const { error } = await db().auth.signOut({ scope: "local" });
  if (error) throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
}
export async function changePassword(password: string): Promise<void> {
  if (password.length < 12) throw new Error("ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร");
  const { error } = await db().auth.updateUser({ password });
  if (error)
    throw new Error(
      "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง",
    );
}
export function subscribeAuth(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const client = getSupabase();
  if (!client) return () => {};
  let active = true;
  const { data } = client.auth.onAuthStateChange((event, session) => {
    // Avoid calling Auth methods while Supabase holds its event lock.
    setTimeout(() => {
      if (active) listener(event, session);
    }, 0);
  });
  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}
