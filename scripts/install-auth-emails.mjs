import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const args=process.argv.slice(2);
if(args.some(a=>!['--apply','--enable-notifications'].includes(a)))throw Error('Options : --apply --enable-notifications');
const patch=JSON.parse(readFileSync(new URL('../supabase/templates/auth-config.json',import.meta.url),'utf8'));
if(args.includes('--enable-notifications'))for(const name of ['password_changed','email_changed','phone_changed','identity_linked','identity_unlinked','mfa_factor_enrolled','mfa_factor_unenrolled'])patch[`mailer_notifications_${name}_enabled`]=true;
if(!args.includes('--apply')){console.log(`Simulation : ${Object.keys(patch).length} champs. Ajoutez --apply pour installer. Les réglages SMTP, URL et méthodes de connexion ne sont pas modifiés.`);process.exit(0);}
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token)throw Error('SUPABASE_ACCESS_TOKEN requis (jeton Management API, jamais une clé anon/service_role).');
const project=process.env.SUPABASE_PROJECT_REF||'gmwcnafoowmeqryqpcpn';
if(!/^[a-z]{20}$/.test(project))throw Error('Référence de projet invalide.');
const url=`https://api.supabase.com/v1/projects/${project}/config/auth`;
async function request(method,body){const r=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Supabase : HTTP ${r.status}. Aucun contenu sensible affiché.`);return r.json();}
const before=await request('GET');
for(const key of Object.keys(patch))if(!(key in before))throw Error(`Champ non pris en charge : ${key}. Aucune modification appliquée.`);
const dir=mkdtempSync(join(tmpdir(),'volteo-auth-emails-'));
writeFileSync(join(dir,'previous.json'),JSON.stringify(Object.fromEntries(Object.keys(patch).map(k=>[k,before[k]])),null,2),{mode:0o600});
console.log(`Sauvegarde des champs modifiés : ${dir}/previous.json`);
await request('PATCH',patch);
const after=await request('GET');
const mismatches=Object.keys(patch).filter(k=>after[k]!==patch[k]);
if(mismatches.length)throw Error(`Vérification incomplète : ${mismatches.join(', ')}. Inspectez le tableau de bord avant toute nouvelle tentative.`);
console.log('13 modèles installés et relus avec succès. Aucun email de test envoyé.');
