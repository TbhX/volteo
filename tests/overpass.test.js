import test from 'node:test';
import assert from 'node:assert/strict';
import {createOverpass} from '../supabase/functions/volteo-services/overpass.js';
const ok=data=>new Response(JSON.stringify(data));
test('OSM mirror failure uses the second fixed source',async()=>{
 const calls=[];const run=createOverpass(async(url,options)=>{calls.push(url);assert.equal(options.method,'POST');return calls.length===1?new Response('',{status:503}):ok({elements:[{id:1}]});});
 assert.equal((await run('query')).elements[0].id,1);assert.equal(calls.length,2);assert.match(calls[1],/^https:\/\/overpass-api.de\//);
});
test('Incomplete or malformed upstream payload never becomes an empty success',async()=>{
 let n=0;const run=createOverpass(async()=>++n===1?ok({remark:'timeout',elements:[]}):ok({wrong:'shape'}));await assert.rejects(run('query'),/indisponible/);assert.equal(n,2);
});
test('Timeout aborts the first request and falls back',async()=>{
 let n=0;const run=createOverpass(async(url,{signal})=>{if(++n===2)return ok({elements:[]});return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));},{timeoutMs:5});
 assert.deepEqual((await run('query')).elements,[]);assert.equal(n,2);
});
test('Concurrent searches share one fetch; cached result keeps its collection date',async()=>{
 let n=0,time=100000;const run=createOverpass(async()=>{n++;await new Promise(r=>setTimeout(r,2));return ok({elements:[]});},{now:()=>time});
 const[a,b]=await Promise.all([run('query'),run('query')]);assert.deepEqual(a,b);time+=1000;assert.equal((await run('query')).retrievedAt,a.retrievedAt);assert.equal(n,1);time+=1800000;await run('query');assert.equal(n,2);
});
test('Excessive responses are rejected before being cached',async()=>{
 let n=0;const run=createOverpass(async()=>{n++;return new Response('huge',{headers:{'content-length':'5000001'}});});await assert.rejects(run('query'),/indisponible/);await assert.rejects(run('query'),/indisponible/);assert.equal(n,4);
});
