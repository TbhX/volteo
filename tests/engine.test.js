import test from 'node:test';import assert from 'node:assert/strict';
import {recommend,tco,tcoDefaults} from '../src/engine.js';
const v={slug:'v',priceMin:30000,seats:5,autonomy:400,fastKW:150,category:'SUV',conso:15};
test('Strict budget and passenger filters',()=>{assert.equal(recommend([v],{budget:29000,seats:5,daily:40,usage:'mixed',charging:'home',category:'Toutes'}).length,0);assert.equal(recommend([v],{budget:40000,seats:6,daily:40,usage:'mixed',charging:'home',category:'Toutes'}).length,0);});
test('Zero interest finance does not count principal twice',()=>{const p={...tcoDefaults,km:0,years:5,apr:0,deposit:0,installation:0,electricMaintenance:0,electricInsurance:0,electricResale:10000};const r=tco(v,p);assert.equal(r.payment,500);assert.equal(r.electric,20000);assert.equal(r.interest,0);});
test('Public charging mix includes loss assumption',()=>{const p={...tcoDefaults,km:10000,homeShare:0,publicRate:.5};assert.equal(tco(v,p).electricEnergy,825.0000000000001);});
