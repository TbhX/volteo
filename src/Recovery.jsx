import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Field} from './Experience';
import {supabase,authError} from './supabase';
export default function Recovery({app:a}){
 const nav=useNavigate(),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 async function submit(e){e.preventDefault();if(password!==confirm){setMsg('Les mots de passe doivent être identiques.');return;}setBusy(true);setMsg('');try{
  const session=await supabase.auth.getSession();if(!session.data.session)throw new Error('Le lien a expiré ou a été ouvert dans un autre navigateur. Demandez un nouveau lien depuis la connexion.');
  const {error}=await supabase.auth.updateUser({password});if(error)throw authError(error);
  const closed=await supabase.auth.signOut({scope:'global'});if(closed.error)throw authError(closed.error);
  a.resetJourney();await a.refresh();a.setToast('Mot de passe modifié. Reconnectez-vous.');nav('/connexion',{replace:true});
 }catch(e){setMsg(e.message);}finally{setBusy(false);}}
 return <main className="container auth registration"><div className="eyebrow">SÉCURITÉ DE VOTRE COMPTE</div><h1>Un nouveau mot de passe.</h1><form className="panel" onSubmit={submit}><Field label="Nouveau mot de passe"><input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></Field><Field label="Confirmer le mot de passe"><input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></Field><button disabled={busy}>{busy?'Enregistrement…':'Enregistrer le mot de passe'}</button>{msg&&<p className="notice" role="alert">{msg}</p>}<button className="text-button" type="button" onClick={()=>nav('/connexion',{replace:true})}>Retour à la connexion</button></form></main>;
}
