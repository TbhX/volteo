export const irveSource='https://www.data.gouv.fr/datasets/beta-bases-nationales-des-points-de-recharge-pour-vehicules-electriques-en-france-irve';
const staticApi='https://tabular-api.data.gouv.fr/api/resources/4ca78c71-4ea4-475d-bd3a-d4aef88f7bf8/data/';
const dynamicUrl='https://proxy.transport.data.gouv.fr/resource/consolidation-nationale-irve-dynamique';
// CSV parser supports escaped quotes, CRLF, commas and embedded newlines.
export function parseCsv(text,visit){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
 else if(c===','&&!quoted){row.push(field);field='';}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));(visit?visit(row):rows.push(row));row=[];field='';}else field+=c;}
 if(quoted)throw Error('CSV incomplet');if(field||row.length){row.push(field.replace(/\r$/,''));(visit?visit(row):rows.push(row));}return rows;
}
export function chargeStatus(row,now=Date.now()){
 const stamp=row?.horodatage,at=typeof stamp==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(stamp)?Date.parse(stamp):NaN,fresh=Number.isFinite(at)&&at<=now+60000&&now-at<=300000;
 if(!fresh)return {live:false,status:'Disponibilité inconnue',statusAt:Number.isFinite(at)?new Date(at).toISOString():null};
 const state=row.etat_pdc,occupation=row.occupation_pdc;
 const status=state==='hors_service'?'Indisponible':state!=='en_service'?'Disponibilité inconnue':occupation==='libre'?'Libre au dernier relevé':occupation==='occupe'?'Occupé':occupation==='reserve'?'Réservé':'Disponibilité inconnue';
 return {live:status!=='Disponibilité inconnue',status,statusAt:new Date(at).toISOString()};
}
export function createIrve(external,distance,fetcher=fetch){
 let dynamic=null,inflight=null;
 async function statuses(){
  if(dynamic&&Date.now()-dynamic.at<60000)return dynamic;
  if(inflight)return inflight;
  inflight=(async()=>{
   const response=await fetcher(dynamicUrl,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('IRVE dynamique indisponible');
   const reader=response.body.getReader(),chunks=[];let size=0;
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000000){await reader.cancel();throw Error('IRVE trop volumineux');}chunks.push(value);}
   const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
   const text=new TextDecoder().decode(raw).replace(/^\uFEFF/,'');
   if(!text.startsWith('id_pdc_itinerance,'))throw Error('Format IRVE inconnu');
   dynamic={at:Date.now(),text};return dynamic;
  })();try{return await inflight;}finally{inflight=null;}
 }
 return async(lat,lon,radius)=>{
  // Bounded query; exact great-circle distance is checked after the bounding box.
  const dy=radius/110,dx=radius/(110*Math.max(.01,Math.cos(lat*Math.PI/180)));
  const q=new URLSearchParams({consolidated_latitude__greater:String(lat-dy),consolidated_latitude__less:String(lat+dy),consolidated_longitude__greater:String(lon-dx),consolidated_longitude__less:String(lon+dx),page_size:'200'});
  const raw=await external(staticApi+'?'+q,3600000);if(!Array.isArray(raw.data))throw Error('IRVE statique indisponible');
  const pages=await Promise.all(Array.from({length:Math.max(0,Math.min(5,Math.ceil((raw.meta?.total||raw.data.length)/200))-1)},(_,i)=>external(staticApi+'?'+q+'&page='+(i+2),3600000)));
  if(pages.some(p=>!Array.isArray(p.data)))throw Error('IRVE statique incomplet');
  const records=[...raw.data,...pages.flatMap(p=>p.data)];
  const seen=new Set();const items=records.map(r=>{
   const lat2=r.consolidated_latitude,lon2=r.consolidated_longitude,id=r.id_pdc_itinerance;
   if(!id||seen.has(id)||r.station_deux_roues===true||!Number.isFinite(lat2)||!Number.isFinite(lon2))return null;
   seen.add(id);const km=distance(lat,lon,lat2,lon2);if(km>radius)return null;
   const sockets=[['prise_type_2','Type 2'],['prise_type_combo_ccs','CCS'],['prise_type_chademo','CHAdeMO'],['prise_type_ef','Prise domestique']].filter(([k])=>r[k]===true).map(([,type])=>({type,power:Number.isFinite(r.puissance_nominale)?r.puissance_nominale+' kW nominaux':'Non renseignée'}));
   return {id:'irve-'+id,pointId:id,kind:'charging',name:r.nom_station||'Point de recharge',address:r.adresse_station||'',lat:lat2,lon:lon2,distance:km,sockets,hours:r.horaires||'Non renseignés',access:r.condition_acces||'Non renseigné',operator:r.nom_operateur||'',tariff:r.tarification||null,staticUpdated:r.date_maj||null,source:irveSource,...chargeStatus(null)};
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance);
  const selected=items.slice(0,100),wanted=new Set(selected.map(x=>x.pointId)),map=new Map();let states;
  try{
   states=await statuses();let header;
   parseCsv(states.text,cells=>{
    if(!header){header=cells;for(const k of ['id_pdc_itinerance','horodatage','etat_pdc','occupation_pdc'])if(!header.includes(k))throw Error('Format IRVE inconnu');return;}
    if(!wanted.has(cells[0]))return;
    const r=Object.fromEntries(header.map((h,i)=>[h,cells[i]])),id=r.id_pdc_itinerance,at=Date.parse(r.horodatage);if(!Number.isFinite(at))return;const old=map.get(id);
    if(!old||at>Date.parse(old.horodatage))map.set(id,r);
    else if(at===Date.parse(old.horodatage)&&(r.etat_pdc!==old.etat_pdc||r.occupation_pdc!==old.occupation_pdc))map.set(id,{...r,etat_pdc:'inconnu',occupation_pdc:'inconnu'});
   });
  }catch{states=null;map.clear();}
  for(const item of selected)Object.assign(item,chargeStatus(map.get(item.pointId)));
  return {items:selected,total:items.length,truncated:raw.meta?.total>records.length||items.length>100,source:irveSource,license:'Licence Ouverte 2.0',retrievedAt:raw._retrievedAt,dynamicRetrievedAt:states?new Date(states.at).toISOString():null,dynamicUnavailable:!states,live:selected.some(x=>x.live)};
 };
}
