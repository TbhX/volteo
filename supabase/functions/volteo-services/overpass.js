// Public OSM mirrors listed by OpenStreetMap. Fixed destinations, no caller-provided URL.
const endpoints=['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter'];
export function createOverpass(fetcher=fetch,{timeoutMs=12000,now=()=>Date.now()}={}){
 const cache=new Map(),pending=new Map();
 return async function overpass(query){
  const hit=cache.get(query);if(hit&&hit.until>now())return hit.value;
  if(pending.has(query))return pending.get(query);
  const load=async()=>{
   for(const endpoint of endpoints){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
     const response=await fetcher(endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded','User-Agent':'VOLTEO/4.6.1 local geographic search'},body:new URLSearchParams({data:query}).toString(),signal:controller.signal});
     if(!response.ok){console.warn('OSM upstream status',new URL(endpoint).host,response.status);await response.body?.cancel();continue;}
     if(Number(response.headers.get('content-length'))>5000000){await response.body?.cancel();continue;}
     const reader=response.body.getReader(),parts=[];let bytes=0;
     while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>5000000){await reader.cancel();throw Error('size');}parts.push(value);}
     const raw=new Uint8Array(bytes);let offset=0;for(const part of parts){raw.set(part,offset);offset+=part.length;}
     const result=JSON.parse(new TextDecoder().decode(raw));
     // An incomplete response must not turn into an empty or misleading list on the map.
     if(result.remark||!Array.isArray(result.elements)){console.warn('OSM incomplete response',new URL(endpoint).host);continue;}
     const value={...result,retrievedAt:new Date(now()).toISOString()};
     if(cache.size>=150)cache.clear();cache.set(query,{value,until:now()+1800000});return value;
    }catch(error){console.warn('OSM upstream failure',new URL(endpoint).host,error?.name||'Error');}
    finally{clearTimeout(timer);}
   }
   throw Error('Source OpenStreetMap temporairement indisponible. Réessayez avec un rayon plus petit.');
  };
  const request=load();pending.set(query,request);try{return await request;}finally{pending.delete(query);}
 };
}
