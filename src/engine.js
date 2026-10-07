export const defaults={km:15000,budget:40000,daily:40,seats:5,charging:'home',usage:'mixed',category:'Toutes'};
export function recommend(vehicles,p){
 const requiredRange=Math.max(p.daily*2,p.usage==='highway'?400:250);
 return vehicles.filter(v=>v.priceMin<=p.budget && v.seats>=p.seats && (p.category==='Toutes'||v.category===p.category)).map(v=>{
 const range=Math.min(v.autonomy/requiredRange,1);const charge=Math.min(v.fastKW/(p.charging==='public'||p.usage==='highway'?150:80),1);
 return {...v,score:Math.round((range*.55+charge*.25+(1-v.priceMin/p.budget)*.2)*100),reasons:[v.autonomy>=requiredRange?'Autonomie cohérente avec votre usage':'Autonomie à vérifier sur vos longs trajets',`${v.seats} places, dans votre budget`,v.fastKW>=150?'Recharge rapide adaptée aux longs trajets':'Recharge rapide à intégrer dans vos pauses']};
 }).sort((a,b)=>b.score-a.score).slice(0,3);
}
export const tcoDefaults={km:15000,years:5,fuel:1.85,liters:6,homeRate:.25,publicRate:.6,homeShare:80,electricMaintenance:350,thermalMaintenance:700,electricInsurance:700,thermalInsurance:650,thermalValue:15000,thermalResale:6000,electricResale:18000,deposit:5000,months:60,apr:4,installation:1200};
export function tco(v,p){
 const principal=Math.max(0,v.priceMin-p.deposit);const r=p.apr/1200;
 const payment=r?principal*r/(1-Math.pow(1+r,-p.months)):principal/p.months;
 const interest=payment*p.months-principal;
 const rate=p.homeRate*p.homeShare/100+p.publicRate*(1-p.homeShare/100);
 const electricEnergy=p.km*v.conso/100*rate*1.1;const thermalEnergy=p.km*p.liters/100*p.fuel;
 const evRunning=electricEnergy+p.electricMaintenance+p.electricInsurance;
 const iceRunning=thermalEnergy+p.thermalMaintenance+p.thermalInsurance;
 // Simplified interest allocation over ownership horizon; principal only via depreciation.
 const electric=(v.priceMin-p.electricResale)+evRunning*p.years+p.installation+interest*Math.min(p.years*12/p.months,1);
 const thermal=(p.thermalValue-p.thermalResale)+iceRunning*p.years;
 return {payment,interest,electric,thermal,electricEnergy,thermalEnergy,evRunning,iceRunning,saving:thermal-electric,monthlyElectric:electric/p.years/12,monthlyThermal:thermal/p.years/12};
}
