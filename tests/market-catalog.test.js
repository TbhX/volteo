import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const models=JSON.parse(fs.readFileSync(new URL('../src/market-models.json',import.meta.url)));
const old=JSON.parse(fs.readFileSync(new URL('../server/vehicles.json',import.meta.url)));
test('Market discovery registry is unique and separate from simulation records',()=>{
 assert.equal(new Set([...models,...old].map(v=>v.slug)).size,models.length+old.length);
 assert(models.every(v=>v.powertrain==='BEV'&&v.market==='FR'&&v.dataLevel==='discovery'));
});
test('Every added model has a dated HTTPS source and no invented zero price',()=>{
 for(const v of models){assert.equal(new URL(v.source).protocol,'https:');assert.equal(v.checkedAt,'2026-10-09');assert(v.technicalNote);assert(v.priceMin===null||v.priceMin>0);assert(v.autonomy===null||v.autonomy>0);}
});
test('Missing mainstream families are represented, hybrids and future smart are not',()=>{
 for(const name of ['4 E-Tech','Scenic E-Tech','EV3','EV4','EV9','Inster','Elroq','E-3008','T03','G6','Dolphin Surf','Micra électrique'])assert(models.some(v=>v.model===name),name);
 assert(!models.some(v=>/DM-i|REEV|#2|Wagoneer|9X/.test(v.model)));
});
