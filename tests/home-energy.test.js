import test from 'node:test';
import assert from 'node:assert/strict';
import {energyStudyDefaults as defaults,energyOrientation,installationBudget} from '../src/home-energy.js';
test('housing alone never confirms a parking installation or Advenir',()=>{
 assert.equal(energyOrientation({...defaults,housing:'flat'}).advenir,false);
 assert.equal(energyOrientation({...defaults,housing:'flat',parking:'no'}).advenir,false);
 assert.equal(energyOrientation({...defaults,housing:'house',parking:'yes'}).advenir,false);
 assert.equal(energyOrientation({...defaults,housing:'flat',parking:'yes'}).advenir,true);
});
test('solar orientation preserves tenants, collective projects and existing panels',()=>{
 assert.match(energyOrientation({...defaults,housing:'house',parking:'yes',tenure:'tenant'}).solar,/propriétaire/);
 assert.match(energyOrientation({...defaults,housing:'flat',parking:'yes'}).solar,/collective/);
 assert.match(energyOrientation({...defaults,housing:'house',parking:'yes',solar:'installed'}).solar,/surplus réel/);
});
test('installation budget deducts only confirmed aid and rejects inconsistent amounts',()=>{
 assert.equal(installationBudget(defaults),null);
 assert.deepEqual(installationBudget({...defaults,quote:'1800',aid:'1000'}),{quote:1800,aid:0,net:1800});
 assert.equal(installationBudget({...defaults,quote:'1800',aid:'1000',aidConfirmed:true}).net,800);
 assert.equal(installationBudget({...defaults,quote:'800',aid:'1000',aidConfirmed:true}),null);
 assert.equal(installationBudget({...defaults,quote:'-1'}),null);
 assert.equal(installationBudget({...defaults,quote:'NaN'}),null);
 assert.equal(installationBudget({...defaults,quote:'0'}).net,0);
});
