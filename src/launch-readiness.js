export function vehicleReview(v,now=Date.now()){
 const issues=[];
 if(!v.variant)issues.push('Version / batterie à identifier');
 if(!/^https:\/\//.test(v.source||''))issues.push('URL source officielle manquante');
 const date=Date.parse(v.updatedAt||'');
 if(!Number.isFinite(date)||date>now||now-date>90*86400000)issues.push('Date de vérification absente ou à renouveler');
 for(const [key,label] of [['priceMin','Prix TTC hors aides'],['autonomy','Autonomie WLTP'],['conso','Consommation']])if(!Number.isFinite(v[key])||v[key]<=0)issues.push(label+' à vérifier');
 if(v.dataLevel==='discovery'||/démonstration|indicati|vérifier/i.test(v.dataStatus||''))issues.push('Données encore indicatives');
 return issues;
}
export function networkReadiness(partners,offers,now=Date.now()/1000){
 const verified=new Set(partners.filter(p=>p.status==='verified').map(p=>String(p.dealer_id)));
 const active=offers.filter(o=>verified.has(String(o.dealer_id))&&o.status==='published'&&o.visible===true&&Number(o.valid_until)>now);
 return {partners:verified.size,offers:active.length};
}
