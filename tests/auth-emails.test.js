import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templates,render,payload} from '../scripts/build-auth-emails.mjs';
test('les 13 modèles Supabase sont générés sans divergence',()=>{
 assert.equal(templates.length,13);assert.equal(new Set(templates.map(t=>t.id)).size,13);
 assert.deepEqual(JSON.parse(readFileSync(new URL('../supabase/templates/auth-config.json',import.meta.url))),payload());
 for(const t of templates)assert.equal(readFileSync(new URL(`../supabase/templates/${t.id}.html`,import.meta.url),'utf8'),render(t));
});
test('les liens Auth restent intacts et les variables sont propres à chaque événement',()=>{
 const specific={email_change:['Email','NewEmail'],email_changed_notification:['OldEmail','Email'],phone_changed_notification:['OldPhone','Phone'],identity_linked_notification:['Provider'],identity_unlinked_notification:['Provider'],mfa_factor_enrolled_notification:['FactorType'],mfa_factor_unenrolled_notification:['FactorType'],reauthentication:['Token']};
 for(const t of templates){
  const html=render(t),allowed=['SiteURL',...(specific[t.id]||[]),...(t.url?['ConfirmationURL']:[])];
  for(const [,variable]of html.matchAll(/{{\s*\.(\w+)\s*}}/g))assert.ok(allowed.includes(variable),`${t.id}: ${variable}`);
  if(t.url)assert.equal((html.match(/href="{{ .ConfirmationURL }}"/g)||[]).length,2);
  assert.ok(!/<script|<form|<img|javascript:/.test(html));
  assert.ok(Buffer.byteLength(html)<100000);
 }
 assert.ok(!Object.keys(payload()).some(k=>k.endsWith('_enabled')),'installer sans activer de fonctionnalités par défaut');
});
