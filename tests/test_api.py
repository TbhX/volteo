import http.cookiejar, json, sys, tempfile, threading, unittest, urllib.request, urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1] / 'server'))
import app

class Client:
    def __init__(self,url):
        self.url=url;self.csrf=None
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def call(self,path,method='GET',data=None,csrf=True,origin=True):
        headers={'Content-Type':'application/json'}
        if origin: headers['Origin']=app.ORIGIN
        if csrf and self.csrf: headers['X-CSRF-Token']=self.csrf
        request=urllib.request.Request(self.url+'/api'+path,data=json.dumps(data or {}).encode() if method!='GET' else None,method=method,headers=headers)
        try:
            with self.opener.open(request) as r: return r.status,json.load(r)
        except urllib.error.HTTPError as r: return r.code,json.load(r)
    def register(self,email,**extra):
        status,r=self.call('/register','POST',{'email':email,'password':'Good-password-123','name':'Test Driver',**extra});assert status==200,(status,r);self.csrf=r['csrf'];return r['user']

class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();app.DB_PATH=str(Path(self.tmp.name)/'test.sqlite');app.initialize()
        self.server=app.ThreadingHTTPServer(('127.0.0.1',0),app.API);self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.url='http://127.0.0.1:'+str(self.server.server_address[1]);self.a=Client(self.url);self.b=Client(self.url)
    def tearDown(self): self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
    def lead(self,client):
        status,result=client.call('/leads','POST',{'vehicle':'peugeot-e-208','dealer_id':1,'phone':'0612345678','message':'Un essai','consent':True});self.assertEqual(status,201,result);return result['id']
    def test_registration_never_grants_role_and_hashes_password(self):
        u=self.a.register('user@example.test',role='admin',dealer_id=1);self.assertEqual(u['role'],'user')
        with app.db() as c:
            stored=c.execute('SELECT password FROM users').fetchone()[0];self.assertNotIn('Good-password',stored)
        self.assertEqual(self.a.call('/admin/users')[0],403)
    def test_csrf_origin_and_anonymous_protection(self):
        self.assertEqual(self.a.call('/me')[0],401);self.a.register('user@example.test')
        self.assertEqual(self.a.call('/logout','POST',csrf=False)[0],403)
        self.assertEqual(self.a.call('/logout','POST',origin=False)[0],403)
        self.assertEqual(self.a.call('/logout','POST')[0],200);self.assertEqual(self.a.call('/me')[0],401)
    def test_profile_favorites_persist_and_are_isolated(self):
        self.a.register('a@example.test');self.b.register('b@example.test')
        p={'km':18000,'daily':50,'budget':40000,'seats':5,'charging':'home','usage':'mixed','category':'Toutes'}
        self.assertEqual(self.a.call('/profile','PUT',p)[0],200)
        self.a.call('/favorites/peugeot-e-208','PUT');self.assertEqual(self.a.call('/me')[1]['favorites'],['peugeot-e-208'])
        self.assertEqual(self.b.call('/me')[1]['favorites'],[])
        self.a.call('/logout','POST');s,r=self.a.call('/login','POST',{'email':'a@example.test','password':'Good-password-123'});self.a.csrf=r['csrf']
        self.assertEqual(self.a.call('/me')[1]['profile'],p)
    def test_dealer_isolation_and_status_history(self):
        customer=self.a.register('a@example.test');dealer=self.b.register('b@example.test');lid=self.lead(self.a)
        with app.db() as c: c.execute("UPDATE users SET role='dealer',dealer_id=2 WHERE id=?",(dealer['id'],))
        self.assertEqual(self.b.call('/leads')[1],[])
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',{'status':'Contacté'})[0],403)
        with app.db() as c: c.execute('UPDATE users SET dealer_id=1 WHERE id=?',(dealer['id'],))
        lead=self.b.call('/leads')[1][0]
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',{'status':'Contacté','expected_updated':lead['updated']})[0],200)
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',{'status':'Terminé','expected_updated':lead['updated']})[0],409)
        self.assertEqual([x['status'] for x in self.a.call('/leads/'+lid)[1]],['Nouveau','Contacté'])
        self.assertEqual(self.a.call('/leads/'+lid,'PATCH',{'status':'Terminé'})[0],403)
    def test_lead_validation_and_consent(self):
        self.a.register('a@example.test')
        base={'vehicle':'peugeot-e-208','dealer_id':1,'phone':'0612345678','consent':True}
        for update in [{'consent':False},{'dealer_id':3},{'phone':'notaphone'},{'vehicle':'missing'}]:
            self.assertEqual(self.a.call('/leads','POST',base|update)[0],400)
    def test_simulation_export_and_delete_cascade(self):
        u=self.a.register('a@example.test');self.lead(self.a)
        self.assertEqual(self.a.call('/simulations','POST',{'vehicle':'peugeot-e-208','km':18000})[0],201)
        self.assertEqual(len(self.a.call('/export')[1]['simulations']),1)
        self.assertEqual(self.a.call('/account','DELETE',{'password':'Bad-password-123'})[0],401)
        self.assertEqual(self.a.call('/account','DELETE',{'password':'Good-password-123'})[0],200)
        with app.db() as c:
            for table in ['users','leads','sessions','simulations','lead_events']: self.assertEqual(c.execute('SELECT COUNT(*) FROM '+table).fetchone()[0],0)
    def test_admin_can_assign_roles_and_update_inventory(self):
        admin=self.a.register('admin@example.test');other=self.b.register('b@example.test')
        with app.db() as c: c.execute("UPDATE users SET role='admin' WHERE id=?",(admin['id'],))
        self.assertEqual(self.a.call('/admin/users/'+other['id'],'PATCH',{'role':'dealer','dealer_id':1})[0],200)
        self.assertEqual(self.b.call('/me')[0],401)
        vehicle=self.a.call('/vehicles')[1][0];vehicle.update(priceMin=29000,priceMax=35000,source='Test interne')
        self.assertEqual(self.a.call('/admin/vehicles/'+vehicle['slug'],'PUT',vehicle)[0],200)
        updated=self.a.call('/vehicles')[1][0];self.assertEqual(updated['priceMin'],29000);self.assertIn('non vérifié',updated['dataStatus'])
    def test_password_change_revokes_all_sessions(self):
        self.a.register('a@example.test');self.assertEqual(self.a.call('/password','POST',{'current':'Good-password-123','password':'New-password-456'})[0],200)
        self.assertEqual(self.a.call('/me')[0],401)
        self.assertEqual(self.a.call('/login','POST',{'email':'a@example.test','password':'Good-password-123'})[0],401)
        self.assertEqual(self.a.call('/login','POST',{'email':'a@example.test','password':'New-password-456'})[0],200)
    def test_login_rate_limit(self):
        self.a.register('a@example.test')
        for i in range(9): self.a.call('/login','POST',{'email':'a@example.test','password':'Wrong-password-123'})
        self.assertEqual(self.a.call('/login','POST',{'email':'a@example.test','password':'Good-password-123'})[0],429)


    def test_project_private_snapshot_consent_and_erasure(self):
        self.a.register('buyer@example.test');other=self.b.register('dealer@example.test')
        project={'budget':40000,'km':15000,'daily':40,'seats':5,'radius':50,'monthly':300,'charging':'home','usage':'mixed','category':'Toutes','horizon':'3months','payment':'finance','tradeIn':'yes','postcode':'75011','notes':'Besoin de place'}
        self.assertEqual(self.a.call('/project','PUT',project)[0],200)
        self.assertIsNone(self.b.call('/project')[1]['project'])
        private_id=self.lead(self.a)
        self.assertIsNone(self.a.call('/leads')[1][0]['project'])
        status,r=self.a.call('/leads','POST',{'vehicle':'peugeot-e-208','dealer_id':1,'phone':'0612345678','consent':True,'share_project':True})
        self.assertEqual(status,201);lid=r['id']
        with app.db() as c:c.execute("UPDATE users SET role='dealer',dealer_id=1 WHERE id=?",(other['id'],))
        shared=next(l for l in self.b.call('/leads')[1] if l['id']==lid)
        self.assertEqual(shared['project']['budget'],40000)
        self.assertEqual(shared['consent_version'],'trial-v2-project')
        self.a.call('/project','PUT',project|{'budget':30000})
        self.assertEqual(next(l for l in self.b.call('/leads')[1] if l['id']==lid)['project']['budget'],40000)
        self.assertEqual(len(self.a.call('/export')[1]['lead_details']),2)
        self.a.call('/account','DELETE',{'password':'Good-password-123'})
        with app.db() as c:
            for table in ['buyer_projects','lead_details','leads']:self.assertEqual(c.execute('SELECT COUNT(*) FROM '+table).fetchone()[0],0)

    def test_appointment_validation_visibility_and_conflict(self):
        import time
        self.a.register('buyer@example.test');dealer=self.b.register('dealer@example.test');lid=self.lead(self.a)
        with app.db() as c:c.execute("UPDATE users SET role='dealer',dealer_id=1 WHERE id=?",(dealer['id'],))
        lead=self.b.call('/leads')[1][0]
        data={'status':'Essai planifié','expected_updated':lead['updated'],'reply':'Rendez-vous convenu au showroom'}
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',data)[0],400)
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',data|{'appointment':time.time()-60})[0],400)
        appointment=time.time()+86400
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',data|{'appointment':appointment})[0],200)
        seen=self.a.call('/leads')[1][0]
        self.assertEqual(seen['appointment'],appointment);self.assertEqual(seen['reply'],data['reply'])
        self.assertEqual(self.b.call('/leads/'+lid,'PATCH',data|{'appointment':appointment})[0],409)
        self.assertEqual(self.a.call('/leads/'+lid,'PATCH',data|{'appointment':appointment})[0],403)

    def test_project_invalid_values_and_invalid_dealer_type(self):
        self.a.register('buyer@example.test')
        self.assertEqual(self.a.call('/project','PUT',{'postcode':'bad'})[0],400)
        self.assertEqual(self.a.call('/leads','POST',{'vehicle':'peugeot-e-208','dealer_id':[]})[0],400)
        self.assertEqual(self.a.call('/leads','POST',{'vehicle':'peugeot-e-208','dealer_id':1,'phone':'0612345678','consent':True,'share_project':True})[0],400)

    def test_security_headers_missing_assets_and_json_type(self):
        self.server.serve_frontend=True
        with urllib.request.urlopen(self.url+'/projet') as r:
            self.assertEqual(r.headers['X-Frame-Options'],'DENY')
            self.assertIn("object-src 'none'",r.headers['Content-Security-Policy'])
            self.assertEqual(r.headers['X-Robots-Tag'],'noindex, nofollow')
        for path in ['/server/app.py','/.env','/media/missing.mp4']:
            with self.assertRaises(urllib.error.HTTPError) as result:urllib.request.urlopen(self.url+path)
            self.assertEqual(result.exception.code,404)
        request=urllib.request.Request(self.url+'/api/login',data=b'{}',headers={'Origin':app.ORIGIN,'Content-Type':'text/plain'})
        with self.assertRaises(urllib.error.HTTPError) as result:urllib.request.urlopen(request)
        self.assertEqual(result.exception.code,415)


    def test_professional_registration_never_self_grants_access(self):
        data={'email':'pro@example.test','name':'Contact Pro','password':'Good-password-123','account_type':'pro','company':'Concession Exemple','registration_id':'123456789','phone':'0612345678','postcode':'75011','privacy_ack':True,'role':'admin','dealer_id':1}
        status,r=self.a.call('/register','POST',data);self.assertEqual(status,200,r);self.a.csrf=r['csrf']
        self.assertEqual(r['user']['role'],'user');self.assertIsNone(r['user']['dealer_id']);self.assertEqual(r['user']['account_type'],'pro')
        self.assertEqual(self.a.call('/admin/users')[0],403)
        self.assertEqual(self.a.call('/project','PUT',{})[0],403)
        self.assertEqual(self.a.call('/leads','POST',{})[0],403)
        self.assertEqual(self.a.call('/leads')[1],[])
        self.assertEqual(self.a.call('/me')[1]['project'],None)
    def test_registration_fields_and_profile_project_consistency(self):
        base={'email':'new@example.test','name':'Buyer','password':'Good-password-123','account_type':'buyer','postcode':'75011','privacy_ack':True}
        for change in [{'postcode':'x'},{'privacy_ack':False},{'account_type':'admin'},{'account_type':'pro'}]:self.assertEqual(self.a.call('/register','POST',base|change)[0],400)
        status,r=self.a.call('/register','POST',base);self.assertEqual(status,200);self.a.csrf=r['csrf']
        project={'budget':40000,'km':21000,'daily':70,'seats':5,'radius':25,'monthly':400,'charging':'home','usage':'mixed','category':'Toutes','horizon':'6months','payment':'finance','tradeIn':'yes','postcode':'44000','notes':''}
        self.assertEqual(self.a.call('/project','PUT',project)[0],200)
        self.assertEqual(self.a.call('/me')[1]['profile']['km'],21000)
        self.assertEqual(self.a.call('/session')[1]['user']['postcode'],'44000')
        profile={k:project[k] for k in ['budget','km','daily','seats','charging','usage','category']};profile['daily']=90
        self.assertEqual(self.a.call('/profile','PUT',profile)[0],200)
        self.assertEqual(self.a.call('/project')[1]['project']['daily'],90)
        self.assertEqual(self.a.call('/project')[1]['project']['horizon'],'6months')

if __name__=='__main__':unittest.main()
