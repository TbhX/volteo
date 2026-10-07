"""WSGI transport: Waitress owns HTTP parsing; never expose http.server publicly."""
import io
import os
from email.message import Message
from http import HTTPStatus
from types import SimpleNamespace
import app

class WSGIHandler(app.API):
    def send_response(self,code,message=None): self.response_status=code
    def send_header(self,key,value): self.response_headers.append((key,str(value)))
    def flush_headers(self): pass


def application(environ,start_response):
    h=object.__new__(WSGIHandler)
    h.request_version='HTTP/1.1';h.response_status=200;h.response_headers=[];h._headers_buffer=[]
    h.command=environ.get('REQUEST_METHOD','GET')
    h.path=environ.get('PATH_INFO','/')
    if environ.get('QUERY_STRING'): h.path+='?'+environ['QUERY_STRING']
    h.headers=Message()
    for k,v in environ.items():
        if k.startswith('HTTP_'): h.headers[k[5:].replace('_','-')]=v
    for k in ['CONTENT_TYPE','CONTENT_LENGTH']:
        if environ.get(k): h.headers[k.replace('_','-')]=environ[k]
    h.client_address=(environ.get('REMOTE_ADDR','127.0.0.1'),0)
    h.rfile=environ['wsgi.input'];h.wfile=io.BytesIO()
    h.server=SimpleNamespace(serve_frontend=True)
    if h.command=='HEAD': h.command='GET'
    if h.command not in ['GET','POST','PUT','PATCH','DELETE']:
        h.reply(405,{'error':'Méthode non autorisée'})
    else: h.dispatch()
    start_response(f'{h.response_status} {HTTPStatus(h.response_status).phrase}',h.response_headers)
    return [b'' if environ['REQUEST_METHOD']=='HEAD' else h.wfile.getvalue()]


def validate_deployment():
    if os.environ.get('VOLTEO_ENV')!='preview':
        raise RuntimeError('Ce prototype se lance avec VOLTEO_ENV=preview. Finaliser les conditions de lancement avant ouverture publique.')
    origin=app.urlparse(app.ORIGIN)
    if origin.scheme!='https' or not origin.netloc or origin.path or origin.query or origin.fragment or origin.username:
        raise RuntimeError('VOLTEO_ORIGIN doit être une origine HTTPS sans chemin.')
    if os.environ.get('VOLTEO_SECURE_COOKIE')!='1': raise RuntimeError('VOLTEO_SECURE_COOKIE=1 obligatoire en prévisualisation hébergée.')
    if app.STORAGE!='supabase':
        if not os.environ.get('VOLTEO_DB') or not os.path.isabs(app.DB_PATH): raise RuntimeError('VOLTEO_DB doit être un chemin absolu hors du dossier public.')
        if app.Path(app.DB_PATH).resolve().is_relative_to((app.ROOT.parent/'dist').resolve()): raise RuntimeError('La base doit être hors de dist.')

if __name__=='__main__':
    validate_deployment()
    from waitress import serve
    app.initialize()
    serve(application,host='127.0.0.1',port=int(os.environ.get('VOLTEO_PORT','8080')),threads=4,
          max_request_body_size=65536,max_request_header_size=16384,channel_timeout=30,
          trusted_proxy='127.0.0.1',trusted_proxy_count=1,
          trusted_proxy_headers={'x-forwarded-for','x-forwarded-proto'},clear_untrusted_proxy_headers=True)
