// Transport-independent public cache. Personal data never enters sessionStorage.
export function createApi(transport,storage=()=>globalThis.sessionStorage){
 const ttl=60000,paths=['/vehicles','/dealers','/articles'],cache=new Map(),inflight=new Map(),listeners=new Set();let pending=0;
 const emit=()=>listeners.forEach(fn=>fn());
 function read(path){if(cache.has(path))return cache.get(path);try{const v=JSON.parse(storage().getItem('volteo-public-v2:'+path)||'null');if(v&&Array.isArray(v.value)&&typeof v.at==='number'&&v.at<=Date.now()){cache.set(path,v);return v;}}catch{}return null;}
 function clearPublicCache(){for(const path of paths){cache.delete(path);try{storage().removeItem('volteo-public-v2:'+path);}catch{}}}
 function publicSnapshot(){const e=paths.map(read);if(e.some(x=>!x||Date.now()-x.at>=ttl))return null;return{vehicles:e[0].value,dealers:e[1].value,articles:e[2].value};}
 async function api(path,method='GET',data={}){
  const reusable=method==='GET'&&paths.includes(path);
  if(reusable){const entry=read(path);if(entry&&Date.now()-entry.at<ttl)return entry.value;if(inflight.has(path))return inflight.get(path);}
  const execute=async()=>{pending++;emit();try{const result=await transport(path,method,data);
   if(reusable){const entry={value:result,at:Date.now()};cache.set(path,entry);try{storage().setItem('volteo-public-v2:'+path,JSON.stringify(entry));}catch{}}
   if(method!=='GET'&&(path.startsWith('/admin/vehicles/')||path==='/pilot/partners'))clearPublicCache();return result;
  }catch(e){if(e instanceof TypeError)throw new Error('Connexion interrompue. Vérifiez votre accès à Internet.');throw e;}finally{pending--;emit();}};
  const request=execute();if(!reusable)return request;inflight.set(path,request);try{return await request;}finally{inflight.delete(path);}
 }
 return{api,publicSnapshot,clearPublicCache,subscribeNetwork:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},networkSnapshot:()=>pending};
}
