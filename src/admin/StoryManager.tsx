import { useState } from "react";
import type { Catalog, Product, Category } from "../lib/types";
import { saveCategory, saveProduct } from "../lib/catalog";
import { ProductEditor } from "./ProductEditor";
import { Modal } from "../components/Modal";
import { errorMessage } from "../lib/validation";

export function StoryManager({ catalog, reload }: {catalog:Catalog;reload:()=>Promise<void>}) {
 const [category,setCategory]=useState<Category|undefined>(catalog.categories.find(c=>c.name==="พิกัดสินค้าในสตอรี่"));
 const [editing,setEditing]=useState<Product|null|undefined>();
 const [busy,setBusy]=useState(false),[editorBusy,setEditorBusy]=useState(false),[error,setError]=useState("");
 const [selected,setSelected]=useState("");
 async function ensureCategory() {
  if(category) return category;
  const c=await saveCategory({name:"พิกัดสินค้าในสตอรี่",sortOrder:999});setCategory(c);return c;
 }
 async function start(copy:boolean) {
  if(busy)return;setBusy(true);setError("");
  try {
   const c=await ensureCategory();
   if(copy) {
    const source=catalog.products.find(p=>p.id===selected);if(!source)throw new Error("เลือกสินค้าก่อนค่ะ");
    const {id,revision,...input}=source;
    await saveProduct({...input,categoryId:c.id,sortOrder:Date.now()/1000|0});await reload();
   } else setEditing(null);
  } catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 }
 return <section><h2>พิกัดสินค้าในสตอรี่</h2><p>คัดลอกการ์ดจากสินค้าเดิม หรือเพิ่มใหม่ การแก้ไขการ์ดสตอรี่ไม่เปลี่ยนสินค้าต้นฉบับ</p>
 <a href="/stories" target="_blank" rel="noopener noreferrer">เปิดหน้าสตอรี่ ↗</a>
 <div className="button-row"><select aria-label="เลือกสินค้าไปสตอรี่" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">เลือกสินค้าที่มีอยู่</option>{catalog.products.filter(p=>p.categoryId!==category?.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
 <button className="button secondary" disabled={busy||!selected} onClick={()=>void start(true)}>คัดลอกไปสตอรี่</button><button className="button primary" disabled={busy} onClick={()=>void start(false)}>เพิ่มการ์ดใหม่</button></div>
 {error&&<p role="alert">{error}</p>}
 {catalog.products.filter(p=>category&&p.categoryId===category.id).map(p=><div className="admin-refresh" key={p.id}><strong>{p.name}</strong><span>{p.published?"เผยแพร่แล้ว":"ซ่อนอยู่"}</span><button className="button secondary" onClick={()=>setEditing(p)}>แก้ไขการ์ด {p.name}</button></div>)}
 {editing!==undefined&&category&&<Modal title="การ์ดสินค้าในสตอรี่" canClose={!editorBusy} onClose={()=>setEditing(undefined)}><ProductEditor product={editing||undefined} defaultCategoryId={category.id} categories={[category]} onBusyChange={setEditorBusy} onCancel={()=>setEditing(undefined)} onSaved={()=>{setEditing(undefined);void reload();}}/></Modal>}
 </section>;
}
