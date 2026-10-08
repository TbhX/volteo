export const stages=['Nouveau','Contacté','Essai planifié','Terminé','Fermé'];
const seconds=value=>Number.isFinite(Number(value))?Number(value):0;
export function dashboardModel({leads=[],offers=[],users=[],days=30,dealer='',includeDemo=false,now=Date.now()/1000}={}){
 const scoped=leads.filter(l=>(!dealer||String(l.dealer_id)===String(dealer))&&(includeDemo||l.trial?.mode==='partner'));
 const period=Math.max(1,Number(days)||30)*86400;
 const current=scoped.filter(l=>seconds(l.created)>=now-period&&seconds(l.created)<=now);
 const previous=scoped.filter(l=>seconds(l.created)>=now-period*2&&seconds(l.created)<now-period);
 const open=scoped.filter(l=>['Nouveau','Contacté'].includes(l.status));
 const urgent=open.filter(l=>now-seconds(l.updated||l.created)>=48*3600).sort((a,b)=>seconds(a.updated||a.created)-seconds(b.updated||b.created));
 const agenda=scoped.filter(l=>l.status==='Essai planifié'&&seconds(l.appointment)>=now).sort((a,b)=>seconds(a.appointment)-seconds(b.appointment));
 const missed=scoped.filter(l=>l.status==='Essai planifié'&&seconds(l.appointment)>0&&seconds(l.appointment)<now&&!l.attended_at);
 const inventory=offers.filter(o=>!dealer||String(o.dealer_id)===String(dealer));
 const expired=inventory.filter(o=>o.status==='published'&&seconds(o.valid_until)<=now);
 const expiring=inventory.filter(o=>o.status==='published'&&seconds(o.valid_until)>now&&seconds(o.valid_until)<now+48*3600);
 const counts=stages.map(label=>({label,value:current.filter(l=>l.status===label).length}));
 const parisDay=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t*1000));
 const trend=Array.from({length:Math.min(Number(days)||30,30)},(_,i)=>{const stamp=now-(Math.min(Number(days)||30,30)-1-i)*86400;const key=parisDay(stamp);return{key,label:new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'numeric',month:'short'}).format(new Date(stamp*1000)),value:current.filter(l=>parisDay(seconds(l.created))===key).length};});
 const attended=current.filter(l=>l.attended_at).length;
 const feedback=current.filter(l=>l.feedback&&Object.keys(l.feedback).length).length;
 const byDealer=Object.entries(current.reduce((map,l)=>{map[l.dealer_id]=(map[l.dealer_id]||0)+1;return map;},{})).map(([id,value])=>({id,value})).sort((a,b)=>b.value-a.value);
 return{current,previous,counts,trend,open,urgent,agenda,missed,inventory,expired,expiring,attended,feedback,byDealer,pendingUsers:users.filter(u=>u.account_type==='pro'&&u.role==='user'),delta:previous.length?Math.round((current.length-previous.length)/previous.length*100):null,demoCount:leads.filter(l=>l.trial?.mode!=='partner'&&(!dealer||String(l.dealer_id)===String(dealer))).length};
}
export function csvCell(value){const s=String(value??'');return '"'+(/^[\s]*[=+@-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';}
export function dashboardCsv(model){return '\ufeff'+[['Indicateur','Valeur'],['Demandes période',model.current.length],['Demandes période précédente',model.previous.length],['À relancer 48 h',model.urgent.length],['Essais à venir',model.agenda.length],['Présences confirmées période',model.attended],...model.counts.map(x=>[x.label,x.value])].map(row=>row.map(csvCell).join(';')).join('\r\n');}
