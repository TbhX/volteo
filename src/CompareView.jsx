import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import photos from './vehicle-photos.json';
import {comparisonSelection} from './engine';
import {Field} from './Experience';
import './compare-view.css';

const eur=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const money=value=>eur.format(Number(value)||0);
const rows=[['Prix indicatif','priceMin',v=>money(v.priceMin)],['Autonomie WLTP','autonomy',v=>`${v.autonomy} km`],['Consommation','conso',v=>`${v.conso} kWh/100 km`],['Recharge rapide','fastKW',v=>`${v.fastKW} kW`],['Places','seats',v=>`${v.seats}`],['Coffre','trunk',v=>`${v.trunk} L`]];

function CompareView({app}){
 const [analysis,setAnalysis]=useState(null);
 const signature=JSON.stringify([app.buyer,app.compare,app.vehicles]);
 useEffect(()=>setAnalysis(null),[signature]);
 const confirmed=analysis===signature;
 const list=comparisonSelection(app.vehicles,app.compare,app.buyer,confirmed);
 const scored=list.filter(v=>v.match);
 const maxScore=scored.length?Math.max(...scored.map(v=>v.match.score)):null;
 const leaders=scored.filter(v=>v.match.score===maxScore);
 const bestMatch=scored.length>=2&&leaders.length===1?leaders[0]:null;
 const best=(key,lower=true)=>{const values=list.map(v=>Number(v[key])).filter(Number.isFinite);if(!values.length)return null;return lower?Math.min(...values):Math.max(...values);};
 return <main className="container compare-view">
  <div className="compare-heading"><div><div className="eyebrow">VOTRE SÉLECTION · {list.length}/3</div><h1>Comparer pour décider.</h1><p className="muted">Les différences importantes apparaissent d’abord. Les données indiquées restent à confirmer auprès du constructeur ou de la concession.</p></div>{app.compare.length>0&&<button className="secondary" onClick={app.clearCompare}>Vider la sélection</button>}<Link className="secondary compare-back" to="/catalogue">Ajouter un modèle ↗</Link></div>
  {!list.length?<section className="compare-empty panel"><div className="compare-empty-icon">+</div><h2>Votre sélection est vide.</h2><p>Ajoutez jusqu’à trois véhicules depuis le catalogue pour comparer autonomie, coût et usage au même endroit.</p><Link className="button" to="/catalogue">Explorer les véhicules <span>→</span></Link></section>:<>
   <form className="panel" onSubmit={e=>{e.preventDefault();setAnalysis(signature);}}>
    <h2>Analyser votre sélection selon votre quotidien.</h2>
    <p>Confirmez vos critères pour vérifier la compatibilité des modèles choisis. Le score est réservé aux modèles compatibles de cette sélection.</p>
    <div className="form-grid">{[['budget','Budget maximum (€)',1000,500000],['daily','Distance totale quotidienne (km)',0,1000],['km','Kilomètres par an',0,200000],['seats','Places nécessaires',1,9]].map(([key,label,min,max])=><Field key={key} label={label}><input required type="number" min={min} max={max} value={app.buyer[key]} onChange={e=>app.updateBuyer({[key]:e.target.value===''?'':Number(e.target.value)})}/></Field>)}
    <Field label="Vos trajets"><select value={app.buyer.usage} onChange={e=>app.updateBuyer({usage:e.target.value})}><option value="city">Ville</option><option value="mixed">Mixte</option><option value="highway">Autoroute régulière</option></select></Field>
    <Field label="Recharge principale"><select value={app.buyer.charging} onChange={e=>app.updateBuyer({charging:e.target.value})}><option value="home">À domicile</option><option value="work">Au travail</option><option value="public">Bornes publiques</option></select></Field>
    <Field label="Format souhaité"><select value={app.buyer.category} onChange={e=>app.updateBuyer({category:e.target.value})}>{['Toutes',...new Set(app.vehicles.map(v=>v.category))].map(c=><option key={c}>{c}</option>)}</select></Field></div>
    <button>{confirmed?'Recalculer mon analyse':'Confirmer mes critères et analyser'}</button>
    <p className="muted">Estimation explicable sur données de démonstration. Budget, places, format et trajet quotidien sont vérifiés avant toute note. Recharge réelle et disponibilité restent à confirmer.</p>
   </form>
   <section className="compare-models" aria-label="Modèles sélectionnés">{list.map(v=>{const photo=photos[v.slug];return <article className="compare-model" key={v.slug}><div className="compare-model-top"><span>Votre sélection</span><button className="text-button" onClick={()=>app.toggleCompare(v.slug)}>Retirer ×</button></div><Link className="compare-model-photo" to={'/vehicules/'+v.slug}><img src={photo?.src} srcSet={photo?`${photo.small} 640w, ${photo.src} ${photo.width}w`:undefined} sizes="(max-width:700px) 82vw, 30vw" alt={photo?.alt||`${v.brand} ${v.model}`} loading="lazy"/>{!photo&&<span>Visuel à confirmer</span>}</Link><div className="compare-model-copy"><span className="eyebrow">{v.category}</span><Link className="compare-model-title" to={'/vehicules/'+v.slug}>{v.brand} {v.model} <span>↗</span></Link><strong>{money(v.priceMin)}</strong><small>prix indicatif · à confirmer</small>{v.match?<div className="compare-match"><span>Adéquation à vos critères</span><b>{v.match.score}<small>/100</small></b><em>{v.match.label}</em></div>:<p>{confirmed?'Critères non respectés · aucun score':'Analyse à confirmer · aucun score'}</p>}
    {confirmed&&<details><summary>Comprendre cette analyse</summary><ul>{v.assessment.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>{v.match&&<><p>{v.match.summary}</p><ul>{v.match.criteria.map(c=><li key={c.key}>{c.label} : {c.detail} · poids {Math.round(c.weight*100)} %</li>)}</ul></>}</details>}<div className="compare-key-stats"><span><b>{v.autonomy}</b>km<br/><small>autonomie</small></span><span><b>{v.fastKW}</b>kW<br/><small>charge DC</small></span><span><b>{v.seats}</b><br/><small>places</small></span></div></div></article>})}</section>
   {bestMatch&&<section className="compare-best-choice" aria-live="polite"><div className="compare-best-mark">✦</div><div className="compare-best-copy"><span className="eyebrow">PARMI VOS MODÈLES SÉLECTIONNÉS ET COMPATIBLES</span><h2>{bestMatch.brand} {bestMatch.model} <strong>{bestMatch.match.score}<small>/100</small></strong></h2><p>{bestMatch.match.summary}</p></div><span className="compare-best-label">{bestMatch.match.label}</span></section>}
   <section className="compare-table panel"><div className="compare-table-heading"><div><div className="eyebrow">LECTURE DÉTAILLÉE</div><h2>Les chiffres côte à côte.</h2></div><span className="compare-hint">Le meilleur indicateur est signalé en vert.</span></div><div className="table-scroll"><table><caption className="sr-only">Comparaison des véhicules sélectionnés</caption><thead><tr><th scope="col">Critère</th>{list.map(v=><th scope="col" key={v.slug}>{v.brand} {v.model}</th>)}</tr></thead><tbody>{confirmed&&<tr className="compare-fit-row"><th scope="row">Adéquation à votre profil</th>{list.map(v=><td key={v.slug}>{v.match?<><b>{v.match.score}/100</b><small>{v.match.label}</small></>:<span>Critères non respectés · non noté</span>}</td>)}</tr>}{rows.map(([label,key,format])=><tr key={key}><th scope="row">{label}</th>{list.map(v=>{const isBest=key==='priceMin'||key==='conso'?Number(v[key])===best(key,true):key==='autonomy'||key==='fastKW'?Number(v[key])===best(key,false):false;return <td className={isBest?'is-best':''} key={v.slug}>{format(v)}{isBest&&<small>Meilleur</small>}</td>})}</tr>)}<tr className="compare-next-row"><th scope="row">Prochaine étape</th>{list.map(v=><td key={v.slug}><Link className="button secondary" to={'/simulateur?vehicle='+v.slug}>Estimer le coût <span>→</span></Link><Link className="table-link" to={'/vehicules/'+v.slug}>Fiche complète ↗</Link></td>)}</tr></tbody></table></div></section>
  </>}
 </main>;
}

export default CompareView;
