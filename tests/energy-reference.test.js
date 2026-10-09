import test from 'node:test';
import assert from 'node:assert/strict';
import {referencesStale,simulationDifference,energyReference} from '../src/energy-reference.js';
import {tco,tcoDefaults} from '../src/engine.js';
test('Dated references expire and do not claim a national public average',()=>{
 assert.equal(referencesStale(Date.parse('2026-10-09')),false);
 assert.equal(referencesStale(Date.parse('2027-02-01')),true);
 assert.equal(energyReference.home.base,.2001);
 assert(energyReference.public.scenario>=energyReference.public.low&&energyReference.public.scenario<=energyReference.public.high);
});
test('Summary distinguishes total ownership gains, surcharges and near equality',()=>{
 assert.equal(simulationDifference(6000,5).monthly,100);
 assert.equal(simulationDifference(-6000,5).label,'Surcoût estimé');
 assert.equal(simulationDifference(1,5).kind,'neutral');
});
test('More expensive public electricity increases cost in proportion to its energy share',()=>{
 const v={priceMin:30000,conso:15};
 const p={...tcoDefaults,homeShare:0,km:10000,years:5};
 assert.equal(tco(v,{...p,publicRate:1}).electric-tco(v,{...p,publicRate:0}).electric,8250);
 assert.equal(tco(v,{...p,homeShare:100,publicRate:5}).electric,tco(v,{...p,homeShare:100,publicRate:0}).electric);
});
