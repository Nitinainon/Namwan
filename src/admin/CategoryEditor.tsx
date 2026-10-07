import { useRef, useState, useEffect, type FormEvent } from "react";
import type { Category } from "../lib/types";
import { saveCategory } from "../lib/catalog";
import { errorMessage } from "../lib/validation";
import { StatusMessage } from "../components/StatusMessage";
export function CategoryEditor({
  category,
  onSaved,
  onCancel,
  onBusyChange,
}: {
  category?: Category;
  onSaved: (c: Category) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [name, setName] = useState(category?.name || ""),
    [order, setOrder] = useState(category?.sortOrder || 0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      onSaved(
        await saveCategory(
          { name, sortOrder: order },
          category?.id,
          category?.revision,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="editor" onSubmit={submit}>
      <h2>{category ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2>
      <p>จัดของที่แนะนำให้ค้นหาได้ง่ายขึ้น</p>
      <label>
        ชื่อหมวดหมู่
        <input
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        ลำดับแสดงผล
        <input
          type="number"
          required
          step="1"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          disabled={busy}
        />
      </label>
      <StatusMessage message={error} error />
      <div className="form-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          ยกเลิก
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? "กำลังบันทึก…" : "บันทึกหมวดหมู่"}
        </button>
      </div>
    </form>
  );
}
