import test from 'node:test';
import assert from 'node:assert/strict';
import {professionalAccount,professionalHome,viewForPath} from '../src/professional-view.js';
test('Only professional accounts have an interface switch',()=>{
 assert.equal(professionalAccount(null),false);
 assert.equal(professionalAccount({role:'user',account_type:'buyer'}),false);
 for(const user of [{role:'dealer'},{role:'admin'},{role:'user',account_type:'pro'}])assert.equal(professionalAccount(user),true);
});
test('Buyer preview never converts business routes or permissions',()=>{
 for(const path of ['/admin','/admin/gestion','/stock','/professionnel','/compte','/parametres'])assert.equal(viewForPath(path,'buyer'),'pro');
 for(const path of ['/catalogue','/comparateur','/projet','/vehicules/example'])assert.equal(viewForPath(path,'pro'),'buyer');
 assert.equal(viewForPath('/','buyer'),'buyer');
 assert.equal(viewForPath('/','pro'),'pro');
 assert.equal(professionalHome({role:'dealer'}),'/tableau-de-bord');
 assert.equal(professionalHome({role:'user',account_type:'pro'}),'/compte');
});
