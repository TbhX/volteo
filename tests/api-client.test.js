import test from 'node:test';
import assert from 'node:assert/strict';
import {createApi} from '../src/api-core.js';
function storage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const fresh=async()=>createApi(async(path,method,data)=>{const r=await fetch(path,{method,body:JSON.stringify(data)});return r.json();});
const result=value=>({ok:true,json:async()=>value});
test('Public parallel loads share a request; personal session never cached',async()=>{
 globalThis.sessionStorage=storage();let calls=0;globalThis.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,2));return result([]);};
 const {api,networkSnapshot}=await fresh();const [a,b]=await Promise.all([api('/vehicles'),api('/vehicles')]);assert.deepEqual(a,b);assert.equal(calls,1);await api('/vehicles');assert.equal(calls,1);await api('/session');await api('/session');assert.equal(calls,3);assert.equal(networkSnapshot(),0);
});
test('Public reload snapshot is bounded by expiry and contains no account',async()=>{
 globalThis.sessionStorage=storage();globalThis.fetch=async()=>result([{slug:'v'}]);const client=await fresh();await Promise.all(['/vehicles','/dealers','/articles'].map(path=>client.api(path)));
 const reload=await fresh();assert.equal(reload.publicSnapshot().vehicles[0].slug,'v');assert.equal(reload.publicSnapshot().user,undefined);
 sessionStorage.setItem('volteo-public-v2:/vehicles',JSON.stringify({value:[],at:Date.now()-61000}));assert.equal((await fresh()).publicSnapshot(),null);
});
test('Catalog admin write invalidates reload cache',async()=>{
 globalThis.sessionStorage=storage();let count=0;globalThis.fetch=async()=>{count++;return result([]);};const client=await fresh();await client.api('/vehicles');await client.api('/admin/vehicles/v','PUT',{});await client.api('/vehicles');assert.equal(count,3);
});
test('Unavailable browser storage does not break requests',async()=>{
 globalThis.sessionStorage={getItem(){throw new Error('Disabled');},setItem(){throw new Error('Disabled');},removeItem(){throw new Error('Disabled');}};globalThis.fetch=async()=>result([]);const client=await fresh();assert.deepEqual(await client.api('/vehicles'),[]);assert.equal(client.publicSnapshot(),null);client.clearPublicCache();
});
test('Private writes retain payload and clear pending state after failure',async()=>{
 const captured=[];const client=createApi(async(...args)=>{captured.push(args);throw Error('denied');});
 await assert.rejects(client.api('/project','PUT',{km:23000}),/denied/);assert.deepEqual(captured[0],['/project','PUT',{km:23000}]);assert.equal(client.networkSnapshot(),0);
});
