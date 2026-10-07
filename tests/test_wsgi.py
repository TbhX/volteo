import io,json,os,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from wsgiref.util import setup_testing_defaults
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import app,wsgi

class TransportTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.old=app.DB_PATH;app.DB_PATH=str(Path(self.tmp.name)/'test.sqlite');app.initialize()
    def tearDown(self):app.DB_PATH=self.old;self.tmp.cleanup()
    def call(self,path,method='GET',body=None,extra=None):
        env={};setup_testing_defaults(env)
        raw=json.dumps(body).encode() if body else b''
        env.update(PATH_INFO=path,REQUEST_METHOD=method,CONTENT_LENGTH=str(len(raw)),CONTENT_TYPE='application/json',HTTP_ORIGIN=app.ORIGIN,**{'wsgi.input':io.BytesIO(raw)})
        env.update(extra or {});response={}
        def start(status,headers):response.update(status=int(status.split()[0]),headers=dict(headers))
        response['body']=b''.join(wsgi.application(env,start));return response
    def test_wsgi_session_headers_auth_and_head(self):
        r=self.call('/api/session');self.assertEqual(r['status'],200);self.assertIsNone(json.loads(r['body'])['user']);self.assertEqual(r['headers']['Cache-Control'],'no-store')
        r=self.call('/api/register','POST',{'name':'Pilot','email':'pilot@example.test','password':'Strong-password-456'})
        self.assertEqual(r['status'],200);self.assertIn('HttpOnly',r['headers']['Set-Cookie']);self.assertIn('SameSite=Lax',r['headers']['Set-Cookie'])
        cookie=r['headers']['Set-Cookie'].split(';')[0]
        self.assertEqual(self.call('/api/me',extra={'HTTP_COOKIE':cookie})['status'],200)
        self.assertEqual(self.call('/api/project','PUT',{},extra={'HTTP_COOKIE':cookie})['status'],403)
        self.assertEqual(self.call('/projet','HEAD')['body'],b'')
        self.assertEqual(self.call('/projet','TRACE')['status'],405)
    def test_preview_requires_https_secure_cookies_and_external_db(self):
        with patch.dict(os.environ,{'VOLTEO_ENV':'preview','VOLTEO_SECURE_COOKIE':'0','VOLTEO_DB':app.DB_PATH}):
            with self.assertRaises(RuntimeError):wsgi.validate_deployment()
        with patch.dict(os.environ,{'VOLTEO_ENV':'preview','VOLTEO_SECURE_COOKIE':'1','VOLTEO_DB':app.DB_PATH}),patch.object(app,'ORIGIN','https://demo.example.test'):
            wsgi.validate_deployment()
