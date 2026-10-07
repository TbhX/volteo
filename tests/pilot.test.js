import test from 'node:test';
import assert from 'node:assert/strict';
import {assessPassport,distanceKm,sameProject,passportDefaults,pilotConfig} from '../src/pilot-engine.js';
const car={autonomy:400,conso:15,priceMin:30000};
const buyer={...passportDefaults,km:15600,daily:40,budget:40000,charging:'home',chargingReady:'confirmed',longTrip:100};
test('Readiness flags unavailable charging, no invented winter measurement',()=>{const r=assessPassport({...buyer,chargingReady:'unavailable'},car);assert.match(r.title,/Sécurisez/);assert.equal(r.usable,224);assert.ok(r.concerns.length);});
test('Charging scenario includes losses and declared detour, zero use stays zero',()=>{const r=assessPassport({...buyer,chargeSessions:2,chargeRate:.6,detourMinutes:10},car);assert.ok(Math.abs(r.weekly-49.5)<1e-9);assert.equal(r.weeklyDetour,20);assert.ok(Math.abs(r.monthlyEnergy-128.7)<1e-9);assert.equal(assessPassport({...buyer,km:0},car).monthlyEnergy,0);});
test('Project comparison handles priority arrays; pilot distance is from Les Ulis',()=>{assert.equal(distanceKm(pilotConfig,pilotConfig),0);assert.ok(distanceKm(pilotConfig,{lat:48.85,lon:2.35})>20);assert.ok(sameProject({...buyer,trialPriorities:['Coffre']},{...buyer,trialPriorities:['Coffre']}));assert.equal(sameProject(buyer,{...buyer,chargeRate:9}),false);});
