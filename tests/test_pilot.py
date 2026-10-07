import json,time,unittest
from unittest.mock import patch
import test_api
from test_api import Client
import app,pilot,geo

class PilotTests(unittest.TestCase):
    setUp=test_api.SecurityTests.setUp
    tearDown=test_api.SecurityTests.tearDown
    def actors(self):
        self.buyer=self.a.register('buyer@example.test')
        self.admin=self.b.register('admin@example.test')
        with app.db() as c:c.execute("UPDATE users SET role='admin' WHERE id=?",(self.admin['id'],))
    def partner(self,**changes):
        data={'name':'Établissement test interne','city':'Les Ulis','address':'Adresse test, ne pas publier','lat':48.6817,'lon':2.1864,'brands':['Peugeot'],'evidence':'Accord fictif pour le test automatique','status':'verified','verification_ack':True}|changes
        code,result=self.b.call('/pilot/partners','PUT',data);self.assertEqual(code,200,result);return result
    def offer(self,p,**changes):
        data={'dealer_id':p['dealer_id'],'vehicle_slug':'peugeot-e-208','trim':'GT · batterie test · neuf','cash_price':30000,'fees':300,'availability':'Véhicule test interne','terms':'Sans condition de financement, simulation interne','source':'Référence de test interne','stock_ack':True,'valid_days':7}|changes
        code,result=self.b.call('/pilot/inventory','POST',data);self.assertEqual(code,200,result);return result
    def lead(self,p,o):
        data={'vehicle':'peugeot-e-208','dealer_id':p['dealer_id'],'offer_id':o['id'],'phone':'0612345678','consent':True,'trial':{'priorities':['Coffre','Recharge'],'route':'Ville puis stationnement'}}
        code,result=self.a.call('/leads','POST',data);self.assertEqual(code,201,result);return result['id']
    def test_pilot_radius_protection_and_source_notes_private(self):
        self.actors();self.assertEqual(self.a.call('/pilot')[1]['radius'],20)
        self.assertEqual(self.a.call('/pilot/settings','PUT',{'radius':10})[0],403)
        self.assertEqual(self.b.call('/pilot/settings','PUT',{'radius':10},csrf=False)[0],403)
        self.assertEqual(self.b.call('/pilot/settings','PUT',{'radius':12})[0],400)
        self.assertEqual(self.b.call('/pilot/settings','PUT',{'radius':15})[1]['radius'],15)
        p=self.partner();registry=self.a.call('/dealers')[1]
        self.assertNotIn('evidence',next(x for x in registry if x['id']==p['dealer_id']))
        self.assertEqual(self.a.call('/pilot/partners')[0],403)
    def test_only_confirmed_fresh_inside_offers_are_public(self):
        self.actors();p=self.partner();o=self.offer(p)
        self.assertEqual(len(Client(self.url).call('/pilot/offers')[1]),1)
        self.assertTrue(o['visible']);self.assertEqual(o['fees'],300)
        with app.db() as c:c.execute('UPDATE pilot_offers SET updated=? WHERE id=?',(time.time()-8*86400,o['id']))
        self.assertEqual(self.a.call('/pilot/offers')[1],[])
        with app.db() as c:c.execute('UPDATE pilot_offers SET updated=? WHERE id=?',(time.time(),o['id']))
        self.partner(**{**p,'status':'suspended','expected_updated':p['updated']})
        self.assertEqual(self.a.call('/pilot/offers')[1],[])
        out=self.partner(lat=49.2);self.assertEqual(self.b.call('/pilot/inventory','POST',{'dealer_id':out['dealer_id']})[0],400)
    def test_inventory_tenant_isolation_and_concurrency(self):
        self.actors();p=self.partner();o=self.offer(p);other=self.partner(name='Autre concession test')
        d=Client(self.url);u=d.register('dealer@example.test',account_type='pro',company='Test Pro',registration_id='123456789',phone='0612345678',postcode='91940',privacy_ack=True)
        self.assertEqual(d.call('/pilot/inventory')[0],403)
        with app.db() as c:c.execute("UPDATE users SET role='dealer',dealer_id=? WHERE id=?",(other['dealer_id'],u['id']))
        self.assertEqual(d.call('/pilot/inventory')[1],[])
        self.assertEqual(d.call('/pilot/inventory/'+o['id'],'PUT',o)[0],403)
        self.assertEqual(self.b.call('/pilot/inventory/'+o['id'],'PUT',{**o,'stock_ack':True,'expected_updated':0})[0],409)
        self.assertEqual(self.a.call('/pilot/inventory')[0],403)
    def test_partner_trial_requires_live_offer_and_correct_model(self):
        self.actors();p=self.partner();o=self.offer(p);lid=self.lead(p,o)
        self.assertEqual(self.a.call('/leads')[1][0]['trial']['offer']['cash_price'],30000)
        base={'vehicle':'peugeot-e-208','dealer_id':p['dealer_id'],'phone':'0612345678','consent':True}
        self.assertEqual(self.a.call('/leads','POST',base)[0],400)
        self.assertEqual(self.a.call('/leads','POST',base|{'offer_id':'deadbeef'})[0],409)
        with app.db() as c:c.execute('UPDATE pilot_offers SET updated=? WHERE id=?',(time.time()-8*86400,o['id']))
        self.assertEqual(self.a.call('/leads','POST',base|{'offer_id':o['id']})[0],409)
        self.assertEqual(len(self.a.call('/leads')[1]),1)
    def test_attendance_code_privacy_feedback_opt_in_and_erasure(self):
        self.actors();p=self.partner();o=self.offer(p);lid=self.lead(p,o)
        self.assertNotIn('attendance_code',self.b.call('/leads')[1][0])
        self.assertNotIn('attendance_code',self.a.call('/leads')[1][0])
        self.assertEqual(self.a.call('/pilot/leads/'+lid+'/feedback','PUT',{'outcome':'compare','reason':'budget'})[0],400)
        with app.db() as c:c.execute('UPDATE lead_details SET appointment=? WHERE lead_id=?',(time.time()-60,lid))
        buyerlead=self.a.call('/leads')[1][0];code=buyerlead['attendance_code']
        self.assertEqual(self.a.call('/pilot/leads/'+lid+'/attendance','POST',{'code':code})[0],403)
        self.assertEqual(self.b.call('/pilot/leads/'+lid+'/attendance','POST',{'code':'999999' if code!='999999' else '888888'})[0],400)
        self.assertEqual(self.b.call('/pilot/leads/'+lid+'/attendance','POST',{'code':code})[0],200)
        self.assertEqual(self.b.call('/pilot/dashboard')[1]['attended'],1)
        self.assertEqual(self.b.call('/pilot/leads/'+lid+'/feedback','PUT',{'outcome':'purchased','reason':'none'})[0],403)
        fb={'outcome':'compare','reason':'budget','liked':'Texte privé','next':'Autre modèle','shared':False}
        self.assertEqual(self.a.call('/pilot/leads/'+lid+'/feedback','PUT',fb)[0],200)
        self.assertEqual(self.b.call('/leads')[1][0]['feedback'],{})
        self.assertEqual(self.b.call('/pilot/dashboard')[1]['feedback'],0)
        self.a.call('/pilot/leads/'+lid+'/feedback','PUT',fb|{'shared':True})
        self.assertEqual(self.b.call('/leads')[1][0]['feedback']['liked'],'Texte privé')
        self.assertEqual(self.b.call('/pilot/dashboard')[1]['reasons']['budget'],1)
        self.a.call('/pilot/leads/'+lid+'/feedback','PUT',fb)
        self.assertEqual(self.b.call('/pilot/dashboard')[1]['reasons']['budget'],0)
        self.a.call('/account','DELETE',{'password':'Good-password-123'})
        with app.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM lead_details').fetchone()[0],0)
    def test_enrollment_uses_server_city_not_claimed_coordinates(self):
        self.actors()
        cities=[{'name':'Les Ulis','code':'91692','lat':48.6817,'lon':2.1864},{'name':'Hors zone test','code':'99999','lat':49.2,'lon':2.2}]
        with patch.object(geo,'cached',side_effect=lambda key,ttl,load:cities):
            eligibility=self.a.call('/pilot/eligibility?postcode=91940')[1]
            self.assertTrue(eligibility[0]['eligible']);self.assertFalse(eligibility[1]['eligible'])
            base={'postcode':'91940','city_code':'91692','consent':True,'source':'meta'}
            self.assertEqual(self.a.call('/pilot/enrollment','PUT',base|{'city_code':'00000'})[0],400)
            self.assertEqual(self.a.call('/pilot/enrollment','PUT',base|{'consent':False})[0],400)
            self.assertEqual(self.a.call('/pilot/enrollment','PUT',base)[1]['status'],'pilot')
            r=self.a.call('/pilot/enrollment','PUT',base|{'city_code':'99999','lat':48.6817,'lon':2.1864})[1];self.assertEqual(r['status'],'outside')
        self.assertEqual(len(self.a.call('/export')[1]['pilot_enrollment']),1)
        self.assertEqual(self.b.call('/pilot/dashboard')[1]['enrollments']['inside'],0)
        self.assertEqual(self.a.call('/pilot/dashboard')[0],403)
        self.a.call('/account','DELETE',{'password':'Good-password-123'})
        with app.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM pilot_enrollments').fetchone()[0],0)
    def test_passport_validation_and_station_access(self):
        self.actors()
        p={'budget':40000,'km':15000,'daily':40,'seats':5,'radius':20,'monthly':0,'charging':'public','usage':'mixed','category':'Toutes','horizon':'exploring','payment':'undecided','tradeIn':'no','postcode':'91940','notes':'','parking':'street','chargingReady':'unknown','trialPriorities':['Recharge'],'chargeRate':.6}
        self.assertEqual(self.a.call('/project','PUT',p)[0],200)
        for bad in [{'primarySource':'javascript:alert(1)'},{'chargeChecked':'2099-01-01'},{'trialPriorities':['fake']},{'chargeSessions':0},{'winterMargin':99}]:self.assertEqual(self.a.call('/project','PUT',p|bad)[0],400)
        self.assertEqual(self.a.call('/project')[1]['project']['parking'],'street')
        node={'id':5,'type':'node','lat':48.6817,'lon':2.1864,'tags':{'amenity':'charging_station','socket:type2_combo':'4','socket:type2_combo:output':'150 kW','access':'yes'}}
        station=geo.normalize_charging(node,48.6817,2.1864)
        self.assertFalse(station['live']);self.assertEqual(station['sockets'][0]['type'],'CCS')
        self.assertIsNone(geo.normalize_charging(node|{'tags':{'access':'private'}},48.6817,2.1864))

if __name__=='__main__':unittest.main()
