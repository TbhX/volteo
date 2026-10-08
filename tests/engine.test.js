import test from 'node:test';import assert from 'node:assert/strict';
import {recommend,scoreVehicle,tco,tcoDefaults,comparisonSelection,defaults} from '../src/engine.js';
const v={slug:'v',priceMin:30000,seats:5,autonomy:400,fastKW:150,category:'SUV',conso:15};
test('Strict budget and passenger filters',()=>{assert.equal(recommend([v],{...defaults,budget:29000,seats:5,daily:40,usage:'mixed',charging:'home',category:'Toutes'}).length,0);assert.equal(recommend([v],{...defaults,budget:40000,seats:6,daily:40,usage:'mixed',charging:'home',category:'Toutes'}).length,0);});
test('Zero interest finance does not count principal twice',()=>{const p={...tcoDefaults,km:0,years:5,apr:0,deposit:0,installation:0,electricMaintenance:0,electricInsurance:0,electricResale:10000};const r=tco(v,p);assert.equal(r.payment,500);assert.equal(r.electric,20000);assert.equal(r.interest,0);});
test('Public charging mix includes loss assumption',()=>{const p={...tcoDefaults,km:10000,homeShare:0,publicRate:.5};assert.equal(tco(v,p).electricEnergy,825.0000000000001);});
test('Personalized score follows the buyer usage',()=>{
 const city={slug:'city',brand:'City',model:'E',priceMin:27000,seats:5,autonomy:320,fastKW:85,conso:14.5,category:'Citadine'};
 const highway={slug:'highway',brand:'High',model:'E',priceMin:39000,seats:5,autonomy:530,fastKW:220,conso:16.8,category:'SUV'};
 const cityProfile={budget:40000,daily:30,km:12000,seats:5,charging:'home',usage:'city',category:'Toutes'};
 const highwayProfile={budget:45000,daily:130,km:30000,seats:5,charging:'public',usage:'highway',category:'Toutes'};
 assert.ok(scoreVehicle(city,cityProfile).score>scoreVehicle(highway,cityProfile).score);
 assert.ok(scoreVehicle(highway,highwayProfile).score>scoreVehicle(city,highwayProfile).score);
 assert.match(scoreVehicle(highway,highwayProfile).summary,/autonomie|recharge|budget/);
 assert.ok(scoreVehicle(highway,highwayProfile).criteria.every(x=>x.score>=0&&x.score<=100));
});

test('Discovery has no scores, rank or top-three truncation',()=>{
 const vehicles=Array.from({length:5},(_,i)=>({...v,slug:'v'+i,priceMin:30000+i*500}));
 const result=recommend(vehicles,defaults);
 assert.deepEqual(result.map(x=>x.slug),vehicles.map(x=>x.slug));
 assert(result.every(x=>!('score' in x)&&!('match' in x)));
});
test('Only confirmed selected compatible vehicles receive comparison scores',()=>{
 const vehicles=[v,{...v,slug:'expensive',priceMin:90000},{...v,slug:'short',autonomy:20}];
 assert(comparisonSelection(vehicles,['v','expensive'],defaults,false).every(x=>x.match===null));
 const result=comparisonSelection(vehicles,['expensive','v','short'],defaults,true);
 assert.deepEqual(result.map(x=>x.slug),['expensive','v','short']);
 assert.equal(result[0].match,null);
 assert.equal(typeof result[1].match.score,'number');
 assert.equal(result[2].match,null);
 assert.equal(comparisonSelection([v],['v'],{...defaults,budget:''},true)[0].match,null);
});
