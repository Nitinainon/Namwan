import { render, screen, waitFor } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
const { state } = vi.hoisted(() => ({
  state: { session: null as any, error: false },
}));
vi.mock("../src/lib/auth", () => ({
  getAdminSession: vi.fn(async () => {
    if (state.error) throw new Error("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
    return state.session;
  }),
  subscribeAuth: () => () => {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../src/admin/Dashboard", () => ({
  default: () => <div>ข้อมูลหลังบ้าน</div>,
}));
import { AdminGate } from "../src/admin/AdminGate";
beforeEach(() => {
  state.session = null;
  state.error = false;
});
test("anonymous users only see password login", async () => {
  render(<AdminGate />);
  expect(await screen.findByLabelText("รหัสผ่าน")).toBeInTheDocument();
  expect(screen.queryByText("ข้อมูลหลังบ้าน")).not.toBeInTheDocument();
});
test("non-admin account cannot render dashboard", async () => {
  state.error = true;
  render(<AdminGate />);
  await screen.findByText("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
  expect(screen.queryByText("ข้อมูลหลังบ้าน")).not.toBeInTheDocument();
});
test("verified admin is allowed into dashboard", async () => {
  state.session = { user: { id: "admin" } };
  render(<AdminGate />);
  await waitFor(() =>
    expect(screen.getByText("ข้อมูลหลังบ้าน")).toBeInTheDocument(),
  );
});
