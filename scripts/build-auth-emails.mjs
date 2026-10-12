import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../supabase/templates/',import.meta.url));
const secure='Si vous n’êtes pas à l’origine de cette modification, ouvrez VOLTÉO directement dans votre navigateur et réinitialisez votre mot de passe depuis la page de connexion. Vérifiez également la sécurité de votre messagerie.';
export const templates=[
 ['confirmation','Confirmez votre inscription à VOLTÉO','Votre projet électrique commence ici.','Confirmez votre adresse email pour activer votre compte. Vous pourrez explorer les modèles, comparer votre sélection et préparer votre projet à votre rythme.','Confirmer mon adresse email','{{ .ConfirmationURL }}','La confirmation de votre email ne valide pas un établissement professionnel. Les fonctions réservées aux concessions nécessitent une validation distincte de VOLTÉO.'],
 ['invite','Votre invitation à rejoindre VOLTÉO','Bienvenue dans votre espace.','Vous avez reçu une invitation à rejoindre VOLTÉO avec cette adresse email. Acceptez-la pour accéder à votre compte.','Accepter mon invitation','{{ .ConfirmationURL }}','Cette invitation ne certifie pas votre établissement et ne garantit aucun accès professionnel : ces droits dépendent de la validation de VOLTÉO.'],
 ['magic_link','Votre lien de connexion à VOLTÉO','Retrouvez votre espace.','Vous avez demandé un lien pour vous connecter à VOLTÉO. Utilisez le bouton ci-dessous pour poursuivre.','Me connecter','{{ .ConfirmationURL }}','Ce lien donne accès à votre compte. Ne le transférez à personne.'],
 ['email_change','Confirmez le changement de votre email VOLTÉO','Une nouvelle adresse pour votre compte.','Une demande de remplacement de l’adresse <strong>{{ .Email }}</strong> par <strong>{{ .NewEmail }}</strong> a été effectuée. Confirmez uniquement si vous reconnaissez cette demande.','Confirmer le changement','{{ .ConfirmationURL }}','Selon les paramètres de sécurité du compte, une confirmation peut être nécessaire sur chacune des deux adresses.'],
 ['recovery','Réinitialisez votre mot de passe VOLTÉO','Reprenez la main sur votre compte.','Vous avez demandé à réinitialiser votre mot de passe. Ouvrez ce lien dans le navigateur utilisé pour faire la demande, puis choisissez un nouveau mot de passe d’au moins 12 caractères.','Choisir un nouveau mot de passe','{{ .ConfirmationURL }}','Après modification, vous devrez vous reconnecter avec votre nouveau mot de passe.'],
 ['reauthentication','Votre code de vérification VOLTÉO','Confirmez que c’est bien vous.','Pour poursuivre l’action sensible que vous avez demandée, saisissez ce code dans VOLTÉO.','', '', 'Ne partagez ce code avec personne. Si vous n’avez demandé aucune vérification, ignorez cet email.'],
 ['password_changed_notification','VOLTÉO · Votre mot de passe a été modifié','Votre mot de passe a changé.','Le mot de passe de votre compte VOLTÉO a été modifié. Si vous avez effectué cette action, aucune autre démarche n’est nécessaire.'],
 ['email_changed_notification','VOLTÉO · Votre adresse email a été modifiée','Votre adresse de connexion a changé.','L’adresse email de votre compte VOLTÉO a été remplacée :<br>Ancienne adresse : <strong>{{ .OldEmail }}</strong><br>Nouvelle adresse : <strong>{{ .Email }}</strong>'],
 ['phone_changed_notification','VOLTÉO · Votre numéro de téléphone a été modifié','Votre téléphone de connexion a changé.','Le numéro de téléphone associé à votre authentification VOLTÉO a été modifié :<br>Ancien numéro : <strong>{{ .OldPhone }}</strong><br>Nouveau numéro : <strong>{{ .Phone }}</strong>'],
 ['identity_linked_notification','VOLTÉO · Une méthode de connexion a été ajoutée','Une nouvelle façon de vous connecter.','Une méthode de connexion <strong>{{ .Provider }}</strong> a été associée à votre compte VOLTÉO.'],
 ['identity_unlinked_notification','VOLTÉO · Une méthode de connexion a été retirée','Une méthode de connexion a été retirée.','La méthode de connexion <strong>{{ .Provider }}</strong> a été dissociée de votre compte VOLTÉO.'],
 ['mfa_factor_enrolled_notification','VOLTÉO · Une méthode de vérification a été ajoutée','Une vérification supplémentaire a été ajoutée.','Une méthode de vérification <strong>{{ .FactorType }}</strong> a été ajoutée à votre compte VOLTÉO.'],
 ['mfa_factor_unenrolled_notification','VOLTÉO · Une méthode de vérification a été retirée','Une méthode de vérification a été retirée.','Une méthode de vérification <strong>{{ .FactorType }}</strong> a été supprimée de votre compte VOLTÉO.']
].map(([id,subject,title,body,cta,url,note])=>({id,subject,title,body,cta,url,note}));
export function render(t){
 const notification=t.id.endsWith('_notification');
 const button=t.cta?`<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#d4f568" style="border-radius:8px"><a href="${t.url}" style="display:inline-block;padding:17px 24px;color:#162820;font-weight:bold;text-decoration:none">${t.cta}</a></td></tr></table>`:'';
 return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t.subject}</title></head>
<body style="margin:0;padding:0;background:#f3f5f1;color:#20332b;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${t.title} Un message concernant votre compte VOLTÉO.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f5f1"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce3dc;border-radius:16px">
<tr><td bgcolor="#142c25" style="padding:28px 32px;color:#ffffff;border-radius:16px 16px 0 0"><a href="{{ .SiteURL }}" style="color:#d4f568;text-decoration:none;font-size:26px;font-weight:bold;letter-spacing:3px">VOLTÉO</a><p style="margin:10px 0 0;font-size:13px;color:#e1e9e2">L’électrique, à votre rythme.</p></td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.65;overflow-wrap:anywhere;word-break:break-word">
<p style="font-size:11px;letter-spacing:2px;font-weight:bold;color:#53685e;margin:0 0 12px">${notification?'SÉCURITÉ DE VOTRE COMPTE':'VOTRE ESPACE VOLTÉO'}</p>
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;letter-spacing:-0.6px">${t.title}</h1><p>Bonjour,</p><p style="margin:0 0 24px">${t.body}</p>
${button}${t.id==='reauthentication'?'<p style="padding:18px;background:#eff4e8;border:1px solid #dce3dc;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold">{{ .Token }}</p>':''}
${t.note?`<p style="font-size:14px;color:#53685e;margin:24px 0">${t.note}</p>`:''}
${t.url?`<p style="font-size:13px;color:#53685e;margin-top:24px">Ce lien est personnel, à usage unique et à durée limitée. S’il a expiré, demandez un nouveau lien depuis VOLTÉO.</p><p style="font-size:12px;color:#53685e">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#245b45;word-break:break-all">{{ .ConfirmationURL }}</a></p><p style="font-size:13px;color:#53685e">Vous n’avez pas fait cette demande ? N’utilisez pas le lien. Aucun changement ne sera confirmé par cet email sans votre action.</p>`:''}
${notification?`<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:18px;background:#fff5e8;border-left:3px solid #b87528;font-size:14px"><strong>Vous ne reconnaissez pas cette action ?</strong><br>${secure}</td></tr></table><p style="font-size:13px">Si vous n’avez plus accès à votre compte, utilisez uniquement les coordonnées de contact affichées sur le site officiel VOLTÉO.</p>`:''}
<p style="margin:28px 0 0">À bientôt,<br><strong>L’équipe VOLTÉO</strong></p></td></tr>
<tr><td style="padding:22px 32px;background:#edf2ec;border-radius:0 0 16px 16px;font-size:12px;line-height:1.6;color:#53685e">Email automatique lié à votre compte. Ne communiquez jamais votre mot de passe ni votre code de vérification.<br><a href="{{ .SiteURL }}" style="color:#245b45">Ouvrir VOLTÉO</a></td></tr>
</table></td></tr></table></body></html>\n`;
}
export function payload(){return Object.fromEntries(templates.flatMap(t=>[[`mailer_subjects_${t.id}`,t.subject],[`mailer_templates_${t.id}_content`,render(t)]]));}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 mkdirSync(root,{recursive:true});
 for(const t of templates)writeFileSync(root+t.id+'.html',render(t));
 writeFileSync(root+'manifest.json',JSON.stringify(templates.map(({id,subject})=>({id,subject,file:id+'.html'})),null,2)+'\n');
 writeFileSync(root+'auth-config.json',JSON.stringify(payload(),null,2)+'\n');
 console.log('13 modèles et configuration générés.');
}
