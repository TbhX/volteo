import {useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';

export const professionalAccount=user=>!!user&&(user.account_type==='pro'||['dealer','admin'].includes(user.role));
export const professionalHome=user=>user?.role==='admin'?'/admin':user?.role==='dealer'?'/tableau-de-bord':'/compte';
export const businessPath=path=>['/tableau-de-bord','/professionnel','/stock','/compte','/parametres','/connexion'].includes(path)||path==='/admin'||path.startsWith('/admin/');
export function viewForPath(path,preference='pro'){
 return businessPath(path)?'pro':path==='/'?preference:'buyer';
}
function read(key){try{return JSON.parse(sessionStorage.getItem(key)||'{}');}catch{return {};}}
export function useProfessionalView(user){
 const loc=useLocation(),nav=useNavigate(),enabled=professionalAccount(user),key='volteo-view:'+user?.id;
 const [choice,setChoice]=useState(()=>({key,...read(key)}));
 const saved=choice.key===key?choice:read(key);
 const mode=enabled?viewForPath(loc.pathname,saved.mode||'pro'):'buyer';
 useEffect(()=>{
  if(!enabled)return;
  const next={...saved,key,mode,[mode+'Path']:loc.pathname+loc.search};
  setChoice(next);
  try{sessionStorage.setItem(key,JSON.stringify(next));}catch{}
 },[key,enabled,mode,loc.pathname,loc.search]);
 function switchView(){
  const nextMode=mode==='pro'?'buyer':'pro';
  const candidate=saved[nextMode+'Path'];
  // Only restore local paths belonging to the chosen interface.
  const safe=typeof candidate==='string'&&candidate.startsWith('/')&&!candidate.startsWith('//')&&viewForPath(candidate.split('?')[0],nextMode)===nextMode;
  const path=safe?candidate:nextMode==='pro'?professionalHome(user):'/';
  const next={...saved,key,mode:nextMode};
  setChoice(next);try{sessionStorage.setItem(key,JSON.stringify(next));}catch{}
  nav(path);
 }
 return {enabled,mode,switchView,buyerPreview:enabled&&mode==='buyer'};
}
