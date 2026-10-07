export interface Product { id:string;categoryId:string|null;name:string;description:string;recommendation:string;price:number|null;imageUrl:string;affiliateUrl:string;featured:boolean;published:boolean;sortOrder:number;revision:number; }
export type ProductInput = Omit<Product,'id'|'revision'>;
export interface Category { id:string;name:string;sortOrder:number;revision:number; }
export type CategoryInput = Omit<Category,'id'|'revision'>;
export interface SiteSettings { id:'main';siteName:string;tagline:string;introduction:string;bannerUrl:string;affiliateDisclosure:string;revision:number; }
export interface Catalog { products:Product[];categories:Category[];settings:SiteSettings;demo?:boolean; }
