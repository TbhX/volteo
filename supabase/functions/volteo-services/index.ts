import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createOverpass } from './overpass.js';
import { createIrve } from './irve.js';
const overpass=createOverpass();
const irve=createIrve(external,distance);

const url = Deno.env.get('SUPABASE_URL')!;
const publicKey = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default || Deno.env.get('SUPABASE_ANON_KEY')!;
const serverKey = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fuelSource = 'https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/';
const fuelApi = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';
const osm = 'https://www.openstreetmap.org/copyright';
const cache = new Map<string, { until: number; data: any }>();
const rad = (n: number) => n * Math.PI / 180;
function distance(a: number, b: number, c: number, d: number) {
 return Math.round(6371 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(rad(c-a)/2)**2 + Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(rad(d-b)/2)**2))) * 100) / 100;
}
async function external(target: string, ttl: number) {
 const hit = cache.get(target); if (hit && hit.until > Date.now()) return hit.data;
 const r = await fetch(target, { signal: AbortSignal.timeout(23000), headers: { Accept: 'application/json', 'User-Agent': 'VOLTEO/4.6 public geographic data' } });
 if (!r.ok) throw new Error('Source temporairement indisponible. Réessayez.');
 if (Number(r.headers.get('content-length')) > 5000000) throw new Error('Réponse trop volumineuse');
 const reader=r.body!.getReader();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>5000000){await reader.cancel();throw new Error('Réponse trop volumineuse');}chunks.push(value);}
 const buffer=new Uint8Array(size);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 const data=JSON.parse(new TextDecoder().decode(buffer));
 data._retrievedAt=new Date().toISOString();
 if (cache.size >= 20) cache.clear(); cache.set(target, { data, until: Date.now() + ttl }); return data;
}
async function communes(code: string) {
 if (!/^\d{5}$/.test(code)) throw new Error('Code postal invalide');
 const raw = await external('https://geo.api.gouv.fr/communes?' + new URLSearchParams({ codePostal: code, fields: 'nom,code,codesPostaux,centre', format: 'json', geometry: 'centre' }), 86400000);
 const cities = raw.filter((r: any) => r.centre?.coordinates).map((r: any) => ({ name: r.nom, code: r.code, lat: r.centre.coordinates[1], lon: r.centre.coordinates[0] }));
 const { error } = await admin.rpc('volteo_geo_cache', { postcode: code, cities }); if (error) throw new Error('Impossible de vérifier la commune. Réessayez.'); return cities;
}
const safeUrl = (value: unknown) => typeof value === 'string' && /^https?:\/\//.test(value) && value.length < 1000 ? value : null;
Deno.serve(async req => {
 if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
 if (req.method !== 'POST') return reply(405, { error: 'Méthode non autorisée' });
 try {
  if (Number(req.headers.get('content-length')) > 65536) return reply(413, { error: 'Requête trop volumineuse' });
  const raw = await req.text(); if (raw.length > 65536) return reply(413, { error: 'Requête trop volumineuse' });
  const body = JSON.parse(raw), path = typeof body.path === 'string' ? body.path : '';
  // Rate limiter commits independently of upstream failures. No raw IP is stored.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + serverKey));
  const bucket = Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join('');
  const limit = await admin.rpc('volteo_geo_limit', { bucket });
  if (limit.error) return reply(503, { error: 'Service temporairement indisponible' });
  if (!limit.data) return reply(429, { error: 'Trop de recherches. Réessayez dans 15 minutes.' });
  if (path === '/account') {
   // JWT verification is explicit because public geographic routes accept visitors.
   const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
   const { data: identity, error } = await admin.auth.getUser(token);
   if (error || !identity.user?.email) return reply(401, { error: 'Reconnectez-vous pour continuer' });
   const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: 'Bearer '+token } } });
   const live = await client.rpc('volteo_api', { path: '/session', method: 'GET', payload: {} });
   if (live.error || !live.data?.user || live.data?.error) return reply(401, { error: 'Session expirée' });
   const password = body.data?.password;
   if (typeof password !== 'string' || password.length < 12 || password.length > 128) return reply(400, { error: 'Mot de passe requis' });
   const verifier = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
   const check = await verifier.auth.signInWithPassword({ email: identity.user.email, password });
   if (check.error || check.data.user?.id !== identity.user.id) return reply(401, { error: 'Mot de passe incorrect' });
   const logout = await verifier.auth.signOut({ scope: 'global' });
   if (logout.error) return reply(503, { error: 'Impossible de fermer les sessions. Réessayez.' });
   const deleted = await admin.auth.admin.deleteUser(identity.user.id);
   if (deleted.error) return reply(503, { error: 'Suppression non terminée. Réessayez.' });
   return reply(200, { ok: true });
  }
  const parsed = new URL(path, 'https://volteo.invalid'), q = parsed.searchParams;
  if (parsed.pathname === '/location' || parsed.pathname === '/pilot/eligibility') {
   const postcode=q.get('postcode')||'';if(!/^\d{5}$/.test(postcode))return reply(400,{error:'Code postal invalide'});
   const cities=await communes(postcode);
   if(parsed.pathname==='/location')return reply(200,cities);
   const cfg=await admin.rpc('volteo_api',{path:'/pilot',method:'GET',payload:{}});if(cfg.error||!cfg.data?.radius)throw new Error('Pilote indisponible');
   return reply(200,cities.map((c:any)=>{const km=distance(cfg.data.lat,cfg.data.lon,c.lat,c.lon);return {...c,postcode,distance:km,eligible:km<=cfg.data.radius};}));
  }
  if(!['/nearby/fuel','/nearby/dealers','/nearby/charging'].includes(parsed.pathname))return reply(404,{error:'Route introuvable'});
  const lat=Number(q.get('lat')),lon=Number(q.get('lon')),radius=Number(q.get('radius'));
  if(!q.has('lat')||!q.has('lon')||!Number.isFinite(lat)||!Number.isFinite(lon)||lat< -90||lat>90||lon< -180||lon>180||![5,10,15,20,25,30,50].includes(radius))return reply(400,{error:'Position ou rayon invalide'});
  if(parsed.pathname==='/nearby/fuel'){
   const point=`geom'POINT(${lon} ${lat})'`;
   const data=await external(fuelApi+'?'+new URLSearchParams({where:`within_distance(geom, ${point}, ${radius}km)`,order_by:`distance(geom, ${point})`,limit:'100'}),300000);
   const items=(data.results||[]).filter((r:any)=>Number.isFinite(r.geom?.lat)&&Number.isFinite(r.geom?.lon)).map((r:any)=>{
    const prices:Record<string,unknown>={};for(const [label,key] of [['Gazole','gazole'],['SP95','sp95'],['E10','e10'],['SP98','sp98'],['E85','e85'],['GPLc','gplc']]){
     const value=r[key+'_prix'],updated=r[key+'_maj'];if(typeof value!=='number'||value<=0||value>=10||!updated||r[key+'_rupture_type']||Array.isArray(r.carburants_disponibles)&&!r.carburants_disponibles.includes(label))continue;
     prices[label]={value,updated,stale:!Number.isFinite(Date.parse(updated))||Date.now()-Date.parse(updated)>7*86400000};
    }
    return{id:'fuel-'+r.id,kind:'fuel',name:'Station · '+(r.ville||r.cp||''),address:r.adresse||'',city:r.ville||'',lat:r.geom.lat,lon:r.geom.lon,distance:distance(lat,lon,r.geom.lat,r.geom.lon),prices,source:fuelSource,electricCharging:(r.services_service||[]).includes('Bornes électriques')};
   }).filter((r:any)=>r.distance<=radius).sort((a:any,b:any)=>a.distance-b.distance);
   return reply(200,{items,total:data.total_count||items.length,source:fuelSource,license:'Licence Ouverte 2.0',retrievedAt:data._retrievedAt,refreshAfterSeconds:600,live:false});
  }
  if(parsed.pathname==='/nearby/charging')return reply(200,await irve(lat,lon,radius));
  const charging=parsed.pathname==='/nearby/charging';const filter=charging?'"amenity"="charging_station"':'"shop"="car"';
  const result=await overpass(`[out:json][timeout:9];nwr[${filter}](around:${radius*1000},${lat},${lon});out center tags;`);
  const items=(result.elements||[]).map((r:any)=>{
   const t=r.tags||{},c=r.center||r;if(!Number.isFinite(c.lat)||!Number.isFinite(c.lon))return null;
   if(charging&&(['private','no'].includes(t.access)||t.motorcar==='no'))return null;
   const common={id:`osm-${r.type}-${r.id}`,kind:charging?'charging':'dealer',name:t.name||t.operator||t.brand||(charging?'Station de recharge':'Établissement automobile'),address:['addr:housenumber','addr:street','addr:postcode','addr:city'].map(k=>t[k]||'').join(' ').trim(),lat:c.lat,lon:c.lon,distance:distance(lat,lon,c.lat,c.lon),source:`https://www.openstreetmap.org/${r.type}/${r.id}`};
   if(!charging)return {...common,city:t['addr:city']||'',brands:t.brand||'',website:safeUrl(t.website||t['contact:website']),electricConfirmed:false};
   const sockets=[['type2','Type 2'],['type2_cable','Type 2 avec câble'],['type2_combo','CCS'],['chademo','CHAdeMO']].filter(([k])=>t['socket:'+k]&&!['0','no'].includes(t['socket:'+k])).map(([k,type])=>({type,count:String(t['socket:'+k]),power:t['socket:'+k+':output']||'Non renseignée'}));
   return {...common,sockets,hours:t.opening_hours||'Non renseignés',access:t.access||'Non renseigné',operator:t.operator||'',live:false};
  }).filter((r:any)=>r&&r.distance<=radius).sort((a:any,b:any)=>a.distance-b.distance);
  return reply(200,{items:items.slice(0,100),total:items.length,source:osm,license:'ODbL',retrievedAt:result.retrievedAt,live:false});
 } catch(error) {
  if(error instanceof SyntaxError)return reply(400,{error:'JSON invalide'});
  return reply(503,{error:'Source temporairement indisponible. Réessayez dans quelques instants.'});
 }
});
