import React from 'react';
import {Link} from 'react-router-dom';
import photos from './vehicle-photos.json';
import './compare-view.css';

const eur=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const money=value=>eur.format(Number(value)||0);
const rows=[['Prix indicatif','priceMin',v=>money(v.priceMin)],['Autonomie WLTP','autonomy',v=>`${v.autonomy} km`],['Consommation','conso',v=>`${v.conso} kWh/100 km`],['Recharge rapide','fastKW',v=>`${v.fastKW} kW`],['Places','seats',v=>`${v.seats}`],['Coffre','trunk',v=>`${v.trunk} L`]];

function CompareView({app}){
 const list=app.vehicles.filter(v=>app.compare.includes(v.slug));
 const best=(key,lower=true)=>{const values=list.map(v=>Number(v[key])).filter(Number.isFinite);if(!values.length)return null;return lower?Math.min(...values):Math.max(...values);};
 return <main className="container compare-view">
  <div className="compare-heading"><div><div className="eyebrow">VOTRE SÉLECTION · {list.length}/3</div><h1>Comparer pour décider.</h1><p className="muted">Les différences importantes apparaissent d’abord. Les données indiquées restent à confirmer auprès du constructeur ou de la concession.</p></div><Link className="secondary compare-back" to="/catalogue">Ajouter un modèle ↗</Link></div>
  {!list.length?<section className="compare-empty panel"><div className="compare-empty-icon">+</div><h2>Votre sélection est vide.</h2><p>Ajoutez jusqu’à trois véhicules depuis le catalogue pour comparer autonomie, coût et usage au même endroit.</p><Link className="button" to="/catalogue">Explorer les véhicules <span>→</span></Link></section>:<>
   <section className="compare-models" aria-label="Modèles sélectionnés">{list.map((v,index)=>{const photo=photos[v.slug];return <article className="compare-model" key={v.slug}><div className="compare-model-top"><span className="compare-rank">0{index+1}</span><button className="text-button" onClick={()=>app.toggleCompare(v.slug)}>Retirer ×</button></div><Link className="compare-model-photo" to={'/vehicules/'+v.slug}><img src={photo?.src} srcSet={photo?`${photo.small} 640w, ${photo.src} ${photo.width}w`:undefined} sizes="(max-width:700px) 82vw, 30vw" alt={photo?.alt||`${v.brand} ${v.model}`} loading="lazy"/>{!photo&&<span>Visuel à confirmer</span>}</Link><div className="compare-model-copy"><span className="eyebrow">{v.category}</span><Link className="compare-model-title" to={'/vehicules/'+v.slug}>{v.brand} {v.model} <span>↗</span></Link><strong>{money(v.priceMin)}</strong><small>prix indicatif · non vérifié</small><div className="compare-key-stats"><span><b>{v.autonomy}</b>km<br/><small>autonomie</small></span><span><b>{v.fastKW}</b>kW<br/><small>charge DC</small></span><span><b>{v.seats}</b><br/><small>places</small></span></div></div></article>})}</section>
   <section className="compare-table panel"><div className="compare-table-heading"><div><div className="eyebrow">LECTURE DÉTAILLÉE</div><h2>Les chiffres côte à côte.</h2></div><span className="compare-hint">Le meilleur indicateur est signalé en vert.</span></div><div className="table-scroll"><table><caption className="sr-only">Comparaison des véhicules sélectionnés</caption><thead><tr><th scope="col">Critère</th>{list.map(v=><th scope="col" key={v.slug}>{v.brand} {v.model}</th>)}</tr></thead><tbody>{rows.map(([label,key,format])=><tr key={key}><th scope="row">{label}</th>{list.map(v=>{const isBest=key==='priceMin'||key==='conso'?Number(v[key])===best(key,true):key==='autonomy'||key==='fastKW'?Number(v[key])===best(key,false):false;return <td className={isBest?'is-best':''} key={v.slug}>{format(v)}{isBest&&<small>Meilleur</small>}</td>})}</tr>)}<tr className="compare-next-row"><th scope="row">Prochaine étape</th>{list.map(v=><td key={v.slug}><Link className="button secondary" to={'/simulateur?vehicle='+v.slug}>Estimer le coût <span>→</span></Link><Link className="table-link" to={'/vehicules/'+v.slug}>Fiche complète ↗</Link></td>)}</tr></tbody></table></div></section>
  </>}
 </main>;
}

export default CompareView;
