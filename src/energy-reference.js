// Curated, dated references: never presented as a live tariff feed.
export const energyReference={
 checkedAt:'2026-10-09',
 home:{base:.2001,offPeak:.1589,peak:.2142,effectiveAt:'2026-08-01',label:'EDF Tarif Bleu · Base 6 kVA · TTC',url:'https://particulier.edf.fr/fr/accueil/guide-energie/electricite/prix-kwh-electricite.html'},
 public:{low:.39,high:.61,scenario:.50,publishedAt:'2026-07-01',label:'Electra France · application · hors spécificités autoroutières',url:'https://intercom.help/go-electra/fr/articles/7987274-les-differents-tarifs-de-charge'},
 share:{value:80,label:'Scénario pédagogique, pas une moyenne mesurée des ménages',url:'https://www.avere-france.org/wp-content/uploads/2026/03/UFE_Smart-Charging-Avere-x-UFE-VF.pdf'}
};
export function referencesStale(now=Date.now()){return now>Date.parse(energyReference.checkedAt+'T00:00:00Z')+90*86400000;}
export function simulationDifference(saving,years){
 const monthly=saving/(years*12);
 return {label:Math.abs(monthly)<.5?'Coûts comparables':saving>=0?'Gain estimé':'Surcoût estimé',kind:Math.abs(monthly)<.5?'neutral':saving>=0?'gain':'cost',monthly:Math.abs(monthly),total:Math.abs(saving)};
}
