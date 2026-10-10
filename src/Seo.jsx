import {useEffect} from 'react';
import photos from './vehicle-photos.json';
import {useLocation} from 'react-router-dom';
import {metadata,siteOrigin,structuredData} from './seo';
export default function Seo({vehicles=[]}){const {pathname}=useLocation();useEffect(()=>{
 const origin=siteOrigin(import.meta.env.VITE_SITE_URL),m=metadata(pathname,origin,vehicles),photo=pathname.startsWith('/vehicules/')?photos[pathname.split('/').filter(Boolean).pop()]:null;document.title=m.title;
 const set=(selector,tag,attrs)=>{let e=document.head.querySelector(selector);if(!e){e=document.createElement(tag);document.head.append(e);}Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));};
 set('meta[name="description"]','meta',{name:'description',content:m.description});set('meta[name="robots"]','meta',{name:'robots',content:m.robots});
 if(m.canonical)set('link[rel="canonical"]','link',{rel:'canonical',href:m.canonical});else document.head.querySelector('link[rel="canonical"]')?.remove();
 for(const [key,value] of Object.entries({'og:title':m.title,'og:description':m.description,'og:type':'website','og:locale':'fr_FR','og:url':m.canonical,'og:image':origin?origin+(photo?.src||'/media/volteo-film-v3-poster.webp'):'','og:image:alt':photo?.alt||'Voiture concept électrique VOLTÉO'}))set(`meta[property="${key}"]`,'meta',{property:key,content:value});
 set('meta[name="twitter:card"]','meta',{name:'twitter:card',content:'summary_large_image'});
 document.getElementById('volteo-jsonld')?.remove();const data=structuredData(m.path,origin);if(data){const script=document.createElement('script');script.id='volteo-jsonld';script.type='application/ld+json';script.textContent=JSON.stringify(data);document.head.append(script);}
 },[pathname,vehicles]);return null;}
