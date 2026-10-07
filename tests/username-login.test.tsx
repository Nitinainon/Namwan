import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
const { credentials } = vi.hoisted(() => ({ credentials: { value: null as any } }));
vi.mock("../src/lib/supabase", () => ({ getSupabase: () => ({ auth: { signInWithPassword: async (value: unknown) => { credentials.value = value; return { error: null }; } } }) }));
import { signIn } from "../src/lib/auth";
import { Login } from "../src/admin/Login";
test("username login submits the account alias without altering the password", async () => {
  await signIn(" Namwan ", " password with spaces ");
  expect(credentials.value).toEqual({ email: "namwan@admin.numwan.netlify.app", password: " password with spaces " });
});
test("login accepts a username without email browser validation", () => {
  render(<Login onSuccess={() => {}} message="" />);
  const input = screen.getByLabelText("ยูเซอร์") as HTMLInputElement;
  input.value = "namwan";
  expect(input.checkValidity()).toBe(true);
});
