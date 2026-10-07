import { expect,test,vi,beforeEach } from 'vitest';
const {state}=vi.hoisted(()=>({state:{client:null as any}}));
vi.mock('../src/lib/supabase',()=>({getSupabase:()=>state.client}));
import {saveProduct,loadCatalog,uploadImage} from '../src/lib/catalog';
beforeEach(()=>{state.client=null;});
test('unconfigured backend refuses writes and identifies demo catalog',async()=>{
  await expect(saveProduct({name:'สินค้า',affiliateUrl:'https://shopee.co.th/test'} as any)).rejects.toThrow('เชื่อมต่อ');
  expect((await loadCatalog()).demo).toBe(true);
});
test('save forwards revision and original affiliate URL, and propagates conflict',async()=>{
  const rpc=vi.fn(()=>({single:async()=>({data:null,error:{code:'40001',message:'conflict'}})}));
  state.client={rpc};
  const input={name:'แมว',affiliateUrl:'https://s.shopee.co.th/a?tracking=one',price:0} as any;
  await expect(saveProduct(input,'id-1',7)).rejects.toThrow('ข้อมูลเปลี่ยน');
  expect(rpc).toHaveBeenCalledWith('save_product',{p_id:'id-1',p_expected_revision:7,p_data:input});
});
test('failed upload does not produce a fake public URL',async()=>{
  const publicUrl=vi.fn();
  state.client={storage:{from:()=>({upload:async()=>({error:{message:'offline'}}),getPublicUrl:publicUrl})}};
  await expect(uploadImage(new File(['x'],'x.webp',{type:'image/webp'}))).rejects.toThrow();
  expect(publicUrl).not.toHaveBeenCalled();
});
