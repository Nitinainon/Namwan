import { lazy, Suspense } from "react";
import { Storefront } from "./storefront/Storefront";
const AdminGate = lazy(() =>
  import("./admin/AdminGate").then((m) => ({ default: m.AdminGate })),
);
export default function App() {
  const admin =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  return admin ? (
    <Suspense
      fallback={<main className="center-state">กำลังเปิดหน้าเข้าสู่ระบบ…</main>}
    >
      <AdminGate />
    </Suspense>
  ) : (
    <Storefront />
  );
}
