import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save, LockKeyhole } from "lucide-react";
import type { SiteSettings } from "../lib/types";
import { saveSettings, uploadImage } from "../lib/catalog";
import { changePassword } from "../lib/auth";
import { errorMessage, isImageUrl } from "../lib/validation";
import { StatusMessage } from "../components/StatusMessage";
export function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: SiteSettings;
  onSaved: (s: SiteSettings) => void;
}) {
  const [form, setForm] = useState(settings),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const lock = useRef(false),
    uploadLock = useRef(false);
  useEffect(() => {
    setForm(settings);
  }, [settings]);
  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current || uploadLock.current) return;
    if (!form.siteName.trim()) {
      setError(true);
      setMessage("กรอกชื่อเว็บ");
      return;
    }
    if (form.bannerUrl && !isImageUrl(form.bannerUrl)) {
      setError(true);
      setMessage("ลิงก์แบนเนอร์ต้องขึ้นต้นด้วย https://");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await saveSettings(form);
      setForm(result);
      onSaved(result);
      setError(false);
      setMessage("บันทึกข้อมูลหน้าร้านแล้ว");
    } catch (e) {
      setError(true);
      setMessage(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    setMessage("");
    try {
      set("bannerUrl", await uploadImage(file));
    } catch (e) {
      setError(true);
      setMessage(errorMessage(e));
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }
  return (
    <>
      <form className="settings-panel" onSubmit={submit}>
        <h2>ปรับหน้าร้านให้เป็นคุณ</h2>
        <fieldset disabled={busy || uploading} className="form-fieldset">
          <label>
            ชื่อเว็บ
            <input
              required
              maxLength={100}
              value={form.siteName}
              onChange={(e) => set("siteName", e.target.value)}
            />
          </label>
          <label>
            คำโปรย
            <input
              maxLength={300}
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </label>
          <label>
            ข้อความแนะนำร้าน
            <textarea
              maxLength={2000}
              rows={3}
              value={form.introduction}
              onChange={(e) => set("introduction", e.target.value)}
            />
          </label>
          <label>
            อัปโหลดแบนเนอร์
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {uploading && <p role="status">กำลังอัปโหลด…</p>}
          <label>
            ลิงก์แบนเนอร์
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => set("bannerUrl", e.target.value)}
              placeholder="ปล่อยว่างเพื่อใช้น้องแมวเป็นแบนเนอร์"
            />
          </label>
          {form.bannerUrl && (
            <img
              className="settings-banner"
              src={form.bannerUrl}
              alt="ตัวอย่างแบนเนอร์"
            />
          )}
          <label>
            ข้อความแจ้ง affiliate
            <textarea
              maxLength={2000}
              rows={3}
              value={form.affiliateDisclosure}
              onChange={(e) => set("affiliateDisclosure", e.target.value)}
            />
          </label>
        </fieldset>
        <StatusMessage message={message} error={error} />
        <button className="button primary" disabled={busy || uploading}>
          <Save size={16} />
          {busy ? "กำลังบันทึก…" : "บันทึกข้อมูลหน้าร้าน"}
        </button>
      </form>
      <PasswordEditor />
    </>
  );
}
function PasswordEditor() {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (password !== confirm) {
      setError(true);
      setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await changePassword(password);
      setPassword("");
      setConfirm("");
      setError(false);
      setMessage("เปลี่ยนรหัสผ่านแล้ว");
    } catch (e) {
      setError(true);
      setMessage(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="settings-panel password-panel" onSubmit={submit}>
      <h2>รหัสผ่านแอดมิน</h2>
      <label>
        รหัสผ่านใหม่
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        ยืนยันรหัสผ่านใหม่
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={busy}
        />
      </label>
      <small>ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร</small>
      <StatusMessage message={message} error={error} />
      <div className="form-actions">
        <button className="button secondary" disabled={busy}>
          <LockKeyhole size={16} />
          {busy ? "กำลังเปลี่ยน…" : "เปลี่ยนรหัสผ่าน"}
        </button>
      </div>
    </form>
  );
}
