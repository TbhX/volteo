import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,chargeStatus,createIrve} from '../supabase/functions/volteo-services/irve.js';
test('IRVE refuses old, future and unknown availability',()=>{
 const now=Date.now(),row={etat_pdc:'en_service',occupation_pdc:'libre',horodatage:new Date(now).toISOString()};
 assert.equal(chargeStatus(row,now).live,true);
 assert.equal(chargeStatus({...row,horodatage:new Date(now-300001).toISOString()},now).live,false);
 assert.equal(chargeStatus({...row,horodatage:new Date(now+120000).toISOString()},now).live,false);
 assert.equal(chargeStatus({...row,etat_pdc:'inconnu'},now).status,'Disponibilité inconnue');
 assert.equal(chargeStatus({...row,horodatage:row.horodatage.slice(0,-1)},now).live,false);
 assert.equal(chargeStatus({...row,occupation_pdc:'occupe'},now).status,'Occupé');
});
test('CSV parser handles quoted fields, newlines and refuses truncated quotes',()=>{
 assert.deepEqual(parseCsv('id,value\r\n1,"ab,cd"\r\n2,"a""b\nc"'),[['id','value'],['1','ab,cd'],['2','a"b\nc']]);
 assert.throws(()=>parseCsv('id,value\n1,"broken'));
});
test('IRVE links status by exact point ID, bounds distances and records truncated coverage',async()=>{
 const at=new Date().toISOString();let dynamicCalls=0;
 const external=async()=>({data:[{id_pdc_itinerance:'A',nom_station:'Local',consolidated_latitude:48,consolidated_longitude:2,prise_type_2:true},{id_pdc_itinerance:'B',consolidated_latitude:49,consolidated_longitude:2}],meta:{total:1001},_retrievedAt:at});
 const fn=createIrve(external,(lat,lon,x)=>x===48?2:100,async()=>{dynamicCalls++;return new Response('id_pdc_itinerance,etat_pdc,occupation_pdc,horodatage\nA,en_service,libre,'+at);});
 const result=await fn(48,2,5);assert.equal(result.items.length,1);assert.equal(result.items[0].live,true);assert.equal(result.truncated,true);assert.equal(result.retrievedAt,at);
 await fn(48,2,5);assert.equal(dynamicCalls,1);
});
test('IRVE keeps positions but never invents availability on a dynamic source failure',async()=>{
 const fn=createIrve(async()=>({data:[{id_pdc_itinerance:'A',consolidated_latitude:48,consolidated_longitude:2}]}),()=>1,async()=>new Response('',{status:503}));
 const result=await fn(48,2,5);assert.equal(result.dynamicUnavailable,true);assert.equal(result.items[0].live,false);assert.equal(result.items[0].status,'Disponibilité inconnue');
});
test('Contradictory simultaneous reports cannot produce a free charger',async()=>{
 const at=new Date().toISOString();const fn=createIrve(async()=>({data:[{id_pdc_itinerance:'A',consolidated_latitude:48,consolidated_longitude:2}]}),()=>1,async()=>new Response('id_pdc_itinerance,etat_pdc,occupation_pdc,horodatage\nA,en_service,libre,'+at+'\nA,en_service,occupe,'+at));
 assert.equal((await fn(48,2,5)).items[0].live,false);
});
