export const defaults={km:15000,budget:40000,daily:40,seats:5,charging:'home',usage:'mixed',category:'Toutes'};

const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Number(value):min));
const number=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const rounded=value=>Math.round(clamp(value));
const euros=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.max(0,number(value,0)));

function profileFor(input={}){return {...defaults,...input};}

function scoreLabel(score){
 if(score>=88)return 'Excellent pour votre usage';
 if(score>=76)return 'Très bon match';
 if(score>=62)return 'Bon compromis';
 if(score>=45)return 'À étudier';
 return 'À vérifier';
}

function criterionDetail(key,score,p,v){
 if(key==='budget')return number(v.priceMin,0)<=number(p.budget,defaults.budget)?`Dans votre enveloppe de ${euros(p.budget)}`:`Au-dessus de votre enveloppe de ${euros(p.budget)}`;
 if(key==='autonomy')return score>=90?`Confortable pour ${number(p.daily,defaults.daily)} km par jour`:`À valider pour ${number(p.daily,defaults.daily)} km par jour`;
 if(key==='recharge')return score>=85?'Puissance adaptée à vos pauses':'Temps de recharge à anticiper';
 if(key==='efficiency')return score>=82?'Consommation bien maîtrisée':'Consommation à intégrer dans le coût total';
 if(key==='seats')return number(v.seats,0)>=number(p.seats,defaults.seats)?`${v.seats} places disponibles`:`Il manque des places (${v.seats}/${p.seats})`;
 return p.category==='Toutes'||!p.category||v.category===p.category?'Format recherché':'Format différent de votre choix';
}

/**
 * Score d'adéquation personnalisé, volontairement explicable.
 * Ce n'est pas une note de qualité absolue : chaque profil déplace les poids
 * vers ce qui compte vraiment pour lui. Les critères restent visibles dans
 * l'interface afin d'éviter l'effet « boîte noire ».
 */
export function scoreVehicle(v,input={}){
 const p=profileFor(input);
 const daily=Math.max(0,number(p.daily,defaults.daily));
 const km=Math.max(0,number(p.km,defaults.km));
 const budget=Math.max(1,number(p.budget,defaults.budget));
 const seats=Math.max(1,number(p.seats,defaults.seats));
 const requiredRange=Math.max(daily*2,p.usage==='highway'?400:p.usage==='city'?180:250);
 const chargeTarget=p.charging==='public'||p.usage==='highway'?150:p.charging==='work'?110:p.usage==='city'?70:90;
 const price=number(v.priceMin,0);
 const autonomy=number(v.autonomy,0);
 const fastKW=number(v.fastKW,0);
 const conso=number(v.conso,18);
 const vehicleSeats=number(v.seats,0);
 const budgetScore=price<=budget?100-((budget-price)/budget)*35:100-((price-budget)/budget)*150;
 const autonomyScore=clamp(autonomy/Math.max(requiredRange,1)*100);
 const rechargeScore=clamp(fastKW/Math.max(chargeTarget,1)*100);
 const efficiencyScore=clamp(100-(conso-13)*7);
 const seatsScore=vehicleSeats>=seats?100:100-(seats-vehicleSeats)*35;
 const formatScore=!p.category||p.category==='Toutes'||v.category===p.category?100:25;
 const weights={budget:.24,autonomy:.32,recharge:.15,efficiency:.14,seats:.10,format:.05};
 if(p.usage==='highway'){weights.autonomy+=.10;weights.recharge+=.08;weights.budget-=.07;weights.efficiency-=.04;}
 if(p.usage==='city'){weights.efficiency+=.07;weights.budget+=.04;weights.autonomy-=.06;weights.recharge-=.04;}
 if(p.charging==='public'){weights.recharge+=.11;weights.autonomy+=.03;weights.budget-=.05;}
 if(p.charging==='work')weights.recharge+=.05;
 if(km>=20000){weights.efficiency+=.05;weights.autonomy+=.03;weights.budget-=.05;}
 if(seats>5){weights.seats+=.08;weights.budget-=.03;}
 const totalWeight=Object.values(weights).reduce((sum,value)=>sum+Math.max(.01,value),0);
 const normalized=Object.fromEntries(Object.entries(weights).map(([key,value])=>[key,Math.max(.01,value)/totalWeight]));
 const raw={budget:budgetScore,autonomy:autonomyScore,recharge:rechargeScore,efficiency:efficiencyScore,seats:seatsScore,format:formatScore};
 const criteria=[
  ['budget','Budget','Budget'],['autonomy','Autonomie','Autonomie'],['recharge','Recharge','Recharge'],['efficiency','Sobriété','Consommation'],['seats','Places','Places'],['format','Format','Format']
 ].map(([key,label])=>({key,label,score:rounded(raw[key]),weight:normalized[key],detail:criterionDetail(key,raw[key],p,v)}));
 const score=rounded(criteria.reduce((sum,criterion)=>sum+criterion.score*criterion.weight,0));
 const label=scoreLabel(score);
 const name=[v.brand,v.model].filter(Boolean).join(' ')||'Ce modèle';
 const budgetText=budgetScore>=85?`prix cohérent avec votre budget de ${euros(budget)}`:`budget à sécuriser autour de ${euros(budget)}`;
 const rangeText=autonomyScore>=88?`autonomie cohérente avec vos ${daily} km quotidiens`:`autonomie à valider pour vos ${daily} km quotidiens`;
 const chargeText=rechargeScore>=82?(p.charging==='public'||p.usage==='highway'?'recharge rapide adaptée à vos longs trajets':'recharge compatible avec votre rythme'):'recharge rapide à anticiper';
 const summary=score>=76
  ?`${name} ressort comme ${label.toLowerCase()} : ${rangeText} et ${budgetText}. ${chargeText}.`
  :`${name} peut convenir, mais ${rangeText} et ${budgetText}. ${chargeText} avant de réserver un essai.`;
 const reasons=[
  autonomyScore>=88?`Autonomie cohérente avec vos ${daily} km quotidiens`:`Autonomie à vérifier pour vos ${daily} km quotidiens`,
  budgetScore>=85?`Prix indicatif dans votre budget de ${euros(budget)}`:`Prix indicatif au-dessus de votre budget de ${euros(budget)}`,
  rechargeScore>=82?(p.charging==='public'||p.usage==='highway'?'Recharge rapide adaptée aux longs trajets':'Recharge adaptée à votre rythme'):'Recharge rapide à intégrer dans vos pauses',
  efficiencyScore>=82?'Consommation bien maîtrisée pour vos kilomètres':'Consommation à comparer dans le coût total',
  vehicleSeats>=seats?`${vehicleSeats} places, comme demandé`:`Seulement ${vehicleSeats} places pour ${seats} nécessaires`
 ];
 return {score,label,summary,criteria,requiredRange,weights:normalized,reasons};
}

export function recommend(vehicles,p={}){
 const profile=profileFor(p);
 return vehicles.filter(v=>v.priceMin<=profile.budget && v.seats>=profile.seats && (profile.category==='Toutes'||v.category===profile.category)).map(v=>{
  const match=scoreVehicle(v,profile);
  return {...v,...match};
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
