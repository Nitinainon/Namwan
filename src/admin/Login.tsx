import { useState, useRef, type FormEvent } from "react";
import { LockKeyhole, ArrowRight, Eye, EyeOff } from "lucide-react";
import { CatMark } from "../components/CatMark";
import { signIn } from "../lib/auth";
import { errorMessage } from "../lib/validation";
import { StatusMessage } from "../components/StatusMessage";
export function Login({
  onSuccess,
  message = "",
}: {
  onSuccess: () => void;
  message?: string;
}) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await signIn(username, password);
      setPassword("");
      onSuccess();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <a className="back-link" href="/">
        ← กลับหน้าร้าน
      </a>
      <div className="login-card">
        <div className="login-cat">
          <CatMark />
        </div>
        <span className="eyebrow">NAMWAN · PRIVATE SPACE</span>
        <h1>ยินดีต้อนรับกลับค่ะ</h1>
        <p>พื้นที่จัดการร้านสำหรับแอดมิน</p>
        <form onSubmit={submit}>
          <label>
            ยูเซอร์
            <input
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น namwan"
            />
          </label>
          <label>
            รหัสผ่าน
            <div className="password-field">
              <input
                aria-label="รหัสผ่าน"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <StatusMessage message={error || message} error />
          <button className="button primary wide" disabled={busy}>
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            <ArrowRight size={17} />
          </button>
        </form>
        <small>
          <LockKeyhole size={14} /> เข้าถึงได้เฉพาะบัญชีแอดมินที่ได้รับสิทธิ์
        </small>
      </div>
    </main>
  );
}
