import test from 'node:test';
import assert from 'node:assert/strict';
import {tco,tcoDefaults,projectBudget,budgetResales} from '../src/engine.js';
const v={priceMin:33000,conso:15.5};
test('Operating savings never hide the cost of switching',()=>{
 const r=tco(v,{...tcoDefaults,homeRate:.2001,publicRate:.5});
 assert(r.energySaving>0);assert(r.saving<0);
 assert(Math.abs(r.saving-(r.runningSaving*5-r.transitionCost))<1e-8);
});
test('Projection matches the main result at the chosen horizon, including manual resale',()=>{
 for(const years of [1,3,5,8]){const p={...tcoDefaults,years,electricResale:19000,thermalResale:4200};const r=tco(v,p),x=projectBudget(v,p,years);assert(Math.abs(r.saving-x.saving)<1e-8);}
});
test('Early ownership includes front-loaded loan interest, not a flat pro rata',()=>{
 const short=tco(v,{...tcoDefaults,years:1,months:24,apr:12});
 assert(short.interestDuringOwnership>short.interest/2);
 assert(short.interestDuringOwnership<short.interest);
 const full=tco(v,{...tcoDefaults,years:2,months:24,apr:12});
 assert(Math.abs(full.interestDuringOwnership-full.interest)<1e-7);
});
test('Resale scenarios depend on model price and horizon',()=>{
 const a=budgetResales(25000,15000,5),b=budgetResales(50000,15000,5),c=budgetResales(25000,15000,8);
 assert(Math.abs(b.electricResale-2*a.electricResale)<=1);assert(c.electricResale<a.electricResale);assert(c.thermalResale<a.thermalResale);
});
test('Cash still includes depreciation without fictitious credit interest',()=>{
 const p={...tcoDefaults,deposit:v.priceMin,apr:0,installation:0};const r=tco(v,p);assert.equal(r.payment,0);assert.equal(r.interestDuringOwnership,0);assert.equal(r.electric,v.priceMin-p.electricResale+r.evRunning*p.years);
});
