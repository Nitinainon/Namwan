import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
const { state } = vi.hoisted(() => ({
  state: { session: null as any, error: false, notify: null as any },
}));
vi.mock("../src/lib/auth", () => ({
  getAdminSession: vi.fn(async () => {
    if (state.error) throw new Error("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
    return state.session;
  }),
  subscribeAuth: (listener: any) => {
    state.notify = listener;
    return () => {
      state.notify = null;
    };
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../src/admin/Dashboard", () => ({
  default: () => (
    <div>
      ข้อมูลหลังบ้าน
      <input aria-label="ข้อมูลที่กำลังแก้" defaultValue="" />
    </div>
  ),
}));
import { AdminGate } from "../src/admin/AdminGate";
beforeEach(() => {
  state.session = null;
  state.error = false;
});

test.each(["TOKEN_REFRESHED", "SIGNED_IN"])(
  "same-user %s preserves unsaved fields",
  async (event) => {
    state.session = { user: { id: "admin" } };
    render(<AdminGate />);
    const input = await screen.findByLabelText("ข้อมูลที่กำลังแก้");
    fireEvent.change(input, { target: { value: "ยังไม่ได้บันทึก" } });
    await act(async () => {
      state.notify(event, state.session);
    });
    expect(await screen.findByLabelText("ข้อมูลที่กำลังแก้")).toHaveValue(
      "ยังไม่ได้บันทึก",
    );
  },
);
test("authorization revoked during refresh removes dashboard", async () => {
  state.session = { user: { id: "admin" } };
  render(<AdminGate />);
  await screen.findByText("ข้อมูลหลังบ้าน");
  state.error = true;
  await act(async () => {
    state.notify("TOKEN_REFRESHED", state.session);
  });
  await screen.findByText("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
  expect(screen.queryByText("ข้อมูลหลังบ้าน")).not.toBeInTheDocument();
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
