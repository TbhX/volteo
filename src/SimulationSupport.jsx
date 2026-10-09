import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Field} from './Experience';
import {energyReference as ref,referencesStale,simulationDifference} from './energy-reference';
import './simulation.css';
const euros=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
export function SimulationLiveResult({result,years,vehicle}){
 const [target,setTarget]=useState(null);
 useEffect(()=>{setTarget(document.getElementById('simulation-summary-slot'));},[]);
 const d=simulationDifference(result.saving,years);
 return target?createPortal(<section className={'simulation-live '+d.kind} aria-label="Résultat de simulation toujours visible"><div><span>{d.label} · bilan complet</span><strong>{euros(d.monthly)}<small>/mois</small></strong><small>Coût total réparti sur {years} ans</small></div><div className="simulation-live-total"><span>{euros(d.total)} sur {years} ans</span><small>{vehicle.brand} {vehicle.model} · hypothèses modifiables</small></div><div className="simulation-live-costs"><span>{result.energySaving>=0?'Économie énergie':'Surcoût énergie'} <b>{euros(Math.abs(result.energySaving)/12)}/mois</b></span><span>Hors achat et autres frais</span></div></section>,target):null;
}
export function EnergyHelp({p,onChange,saved}){
 const stale=referencesStale();
 const apply=patch=>onChange({...p,...patch});
 return <section className="energy-guide" aria-label="Repères énergie et recharge">
  <div className="eyebrow">DES REPÈRES POUR DÉMARRER</div><h2>Combien coûte votre recharge ?</h2>
  <p>Repères vérifiés le 09/10/2026 · prix TTC. {stale?'Ces références datent de plus de 90 jours : vérifiez les tarifs auprès des sources avant de les utiliser.':'Ce sont des références datées, pas des tarifs actualisés en direct.'}</p>
  {saved&&<p>Simulation enregistrée : appliquer un repère modifie uniquement cette copie de travail.</p>}
  <div className="energy-reference-grid">
   <article><h3>À domicile</h3><strong>0,2001 €/kWh</strong><p>Tarif Bleu EDF, Base 6 kVA, au 01/08/2026. Hors abonnement du logement.</p><div className="energy-presets">{[[ref.home.base,'Base 6 kVA'],[ref.home.offPeak,'Heures creuses'],[ref.home.peak,'Heures pleines']].map(([value,label])=><button key={label} type="button" className="secondary" onClick={()=>apply({homeRate:value})}>{label} · {value.toLocaleString('fr-FR')} €</button>)}</div><a href={ref.home.url} target="_blank" rel="noreferrer">Voir la grille EDF ↗</a></article>
   <article><h3>Sur borne publique</h3><strong>0,39 à 0,61 €/kWh</strong><p>Exemple Electra via son application, publication du 01/07/2026. Prix selon la station ; autoroute et badges peuvent différer. Ce n’est pas une moyenne nationale.</p><button className="secondary" type="button" onClick={()=>apply({publicRate:ref.public.scenario})}>Essayer le scénario à 0,50 €</button><a href={ref.public.url} target="_blank" rel="noreferrer">Voir les tarifs et exceptions ↗</a></article>
  </div>
  <div className="form-grid">{[['homeRate','Électricité domicile (€/kWh)'],['publicRate','Recharge publique (€/kWh)']].map(([key,label])=><Field key={key} label={label} help={key==='homeRate'?'Saisissez le prix TTC de votre facture ou choisissez un repère ci-dessus.':'Saisissez votre tarif de borne ou de badge. Frais fixes et abonnements non inclus.'}><input type="number" min="0" max="10" step=".0001" value={p[key]} onChange={e=>apply({[key]:Math.min(10,Math.max(0,Number(e.target.value)))})}/></Field>)}</div>
  <Field label={'Part de recharge domicile (%) : '+p.homeShare+' %'} help={`Le reste, soit ${100-p.homeShare} %, est facturé au tarif public. Il s’agit de la part d’énergie, pas du nombre de branchements.`}><input type="range" min="0" max="100" step="5" value={p.homeShare} onChange={e=>apply({homeShare:Number(e.target.value)})}/></Field>
  <div className="energy-presets">{[[0,'Pas de recharge à domicile'],[50,'Moitié domicile / public'],[80,'Domicile majoritaire'],[100,'Tout à domicile']].map(([value,label])=><button className="secondary" aria-pressed={p.homeShare===value} key={value} onClick={()=>apply({homeShare:value})}>{label} · {value} %</button>)}</div>
  <p className="energy-note">80 % est un point de départ pédagogique. L’étude Avere-France/UFE utilise un profil à 80 % domicile ou entreprise ; ce n’est pas une moyenne propre au domicile. Si vous rechargez au travail, adaptez les tarifs à votre coût réel. <a href={ref.share.url} target="_blank" rel="noreferrer">Méthode ↗</a></p>
  <p><b>Prix moyen de votre scénario : {(p.homeRate*p.homeShare/100+p.publicRate*(1-p.homeShare/100)).toLocaleString('fr-FR',{maximumFractionDigits:4})} €/kWh</b> · avant les 10 % de pertes de recharge supposées.</p>
 </section>;
}
