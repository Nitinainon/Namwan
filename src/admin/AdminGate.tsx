import {
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { getAdminSession, subscribeAuth, signOut } from "../lib/auth";
import { errorMessage } from "../lib/validation";
import { Login } from "./Login";
const Dashboard = lazy(() => import("./Dashboard"));
export function AdminGate() {
  const [state, setState] = useState<"loading" | "login" | "admin">("loading"),
    [message, setMessage] = useState(""),
    [generation, setGeneration] = useState(0);
  const check = useCallback(() => setGeneration((n) => n + 1), []);
  const identity = useRef<string | null>(null);
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.append(meta);
    document.title = "จัดการร้าน · น้ำหวาน";
    return () => meta.remove();
  }, []);
  useEffect(() => {
    let active = true;
    // Same-user token refresh and tab refocus must preserve mounted forms.
    if (!identity.current) setState("loading");
    void getAdminSession()
      .then((s) => {
        if (active) {
          identity.current = s?.user.id || null;
          setMessage("");
          setState(s ? "admin" : "login");
        }
      })
      .catch((e) => {
        if (active) {
          identity.current = null;
          setMessage(errorMessage(e));
          setState("login");
        }
      });
    return () => {
      active = false;
    };
  }, [generation]);
  useEffect(
    () =>
      subscribeAuth((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          identity.current = null;
          setState("login");
          setMessage("");
        } else if (identity.current && session.user.id !== identity.current) {
          identity.current = null;
          setState("loading");
        }
        check();
      }),
    [check],
  );
  if (state === "loading")
    return (
      <main className="center-state" role="status">
        กำลังตรวจสิทธิ์…
      </main>
    );
  return state === "admin" ? (
    <Suspense
      fallback={<main className="center-state">กำลังเปิดหน้าจัดการ…</main>}
    >
      <Dashboard
        onLogout={async () => {
          await signOut();
          identity.current = null;
          setState("login");
        }}
      />
    </Suspense>
  ) : (
    <Login onSuccess={check} message={message} />
  );
}
