import {createClient} from '@supabase/supabase-js';
import config from './supabase-config.json';

// Publishable key only. No service-role credential belongs in this application bundle.
export const supabase=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
export function authError(error){
 const messages={invalid_credentials:'Email ou mot de passe incorrect.',email_not_confirmed:'Confirmez votre adresse email avant de vous connecter.',over_email_send_rate_limit:'Trop de demandes d’email. Patientez avant de réessayer.',over_request_rate_limit:'Trop de tentatives. Réessayez dans quelques minutes.',weak_password:'Choisissez un mot de passe plus robuste.',same_password:'Choisissez un mot de passe différent.',user_already_exists:'Cette adresse est déjà inscrite.',otp_expired:'Le lien a expiré. Demandez un nouveau lien.'};
 return new Error(messages[error?.code]||'Impossible de terminer cette opération. Vérifiez vos informations et réessayez.');
}
async function rpc(path,method='GET',payload={}){
 const {data,error}=await supabase.rpc('volteo_api',{path,method,payload});
 if(error)throw new Error('Connexion à Supabase impossible. Réessayez.');
 if(data?.error){const e=new Error(data.error);e.status=data.status;if(data.status===401)await supabase.auth.signOut({scope:'local'});throw e;}
 return data;
}
async function service(path,data){
 const {data:result,error}=await supabase.functions.invoke('volteo-services',{body:{path,data}});
 if(error){let detail;try{detail=await error.context?.json();}catch{}throw new Error(detail?.error||'Service temporairement indisponible. Réessayez.');}
 return result;
}
export async function cloudApi(path,method='GET',data={}){
 if(path.startsWith('/location?')||path.startsWith('/nearby/')||path.startsWith('/pilot/eligibility?'))return service(path,{});
 if(path==='/register'){
  if(!data.privacy_ack||!/^\d{5}$/.test(data.postcode||''))throw new Error('Code postal et lecture de la notice requis.');
  if(typeof data.password!=='string'||data.password.length<12||data.password.length>128)throw new Error('Mot de passe : 12 à 128 caractères.');
  const {password,email,...profile}=data;
  const result=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{...profile,app:'volteo'},emailRedirectTo:location.origin+'/connexion'}});
  if(result.error)throw authError(result.error);
  if(!result.data.session)return {pendingConfirmation:true};
  return rpc('/session');
 }
 if(path==='/login'){
  const result=await supabase.auth.signInWithPassword({email:data.email.trim().toLowerCase(),password:data.password});if(result.error)throw authError(result.error);return rpc('/session');
 }
 if(path==='/logout'){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw authError(error);return {ok:true};}
 if(path==='/password'){
  if(typeof data.password!=='string'||data.password.length<12||data.password.length>128)throw new Error('Mot de passe : 12 à 128 caractères.');
  const who=await supabase.auth.getUser();if(who.error||!who.data.user)throw new Error('Reconnectez-vous.');
  const check=await supabase.auth.signInWithPassword({email:who.data.user.email,password:data.current});if(check.error)throw authError(check.error);
  const result=await supabase.auth.updateUser({password:data.password});if(result.error)throw authError(result.error);
  const closed=await supabase.auth.signOut({scope:'global'});if(closed.error)throw authError(closed.error);return {ok:true};
 }
 if(path==='/account'&&method==='DELETE'){const result=await service(path,data);await supabase.auth.signOut({scope:'local'});return result;}
 if(path==='/session'){
  const {data:s,error}=await supabase.auth.getSession();if(error){await supabase.auth.signOut({scope:'local'});return {user:null,csrf:null};}
  if(!s.session)return {user:null,csrf:null};
  try{return await rpc(path);}catch(e){if(e.status===401)return {user:null,csrf:null};throw e;}
 }
 return rpc(path,method,data);
}
