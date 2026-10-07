"""VOLTÉO API. Python 3.11+, SQLite, no external runtime dependencies."""
import math
import argparse, hashlib, hmac, json, mimetypes, os, re, secrets, sqlite3, time
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from urllib.parse import urlparse, unquote, parse_qs
import geo
import pilot

ROOT = Path(__file__).resolve().parent
STORAGE = os.environ.get('VOLTEO_STORAGE', 'supabase')
DB_PATH = os.environ.get('VOLTEO_DB', str(ROOT / 'volteo.sqlite3'))
ORIGIN = os.environ.get('VOLTEO_ORIGIN', 'http://localhost:5173')
STATUSES = ['Nouveau', 'Contacté', 'Essai planifié', 'Terminé', 'Fermé']

def db():
    c = sqlite3.connect(DB_PATH, timeout=15)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def initialize():
    if STORAGE == 'supabase': return
    with db() as c:
        c.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','dealer','admin')),dealer_id INTEGER REFERENCES dealers(id),created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS vehicles(slug TEXT PRIMARY KEY,data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS dealers(id INTEGER PRIMARY KEY,data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS articles(slug TEXT PRIMARY KEY,data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS favorites(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,vehicle_slug TEXT REFERENCES vehicles(slug),PRIMARY KEY(user_id,vehicle_slug));
        CREATE TABLE IF NOT EXISTS simulations(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL,created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,vehicle_slug TEXT REFERENCES vehicles(slug),dealer_id INTEGER REFERENCES dealers(id),message TEXT NOT NULL,phone TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Nouveau',created REAL NOT NULL,updated REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS lead_events(id INTEGER PRIMARY KEY,lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,actor TEXT REFERENCES users(id) ON DELETE SET NULL,status TEXT NOT NULL,created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires REAL NOT NULL);
        ''')
        c.executescript("""
        CREATE TABLE IF NOT EXISTS buyer_projects(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL,updated REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS lead_details(lead_id TEXT PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,project TEXT,consent_version TEXT NOT NULL,consent_at REAL NOT NULL,appointment REAL,reply TEXT NOT NULL DEFAULT '');
        """)
        pilot.initialize(c)
        user_columns={r[1] for r in c.execute('PRAGMA table_info(users)')}
        for col,definition in {'account_type':"TEXT NOT NULL DEFAULT 'buyer'",'phone':"TEXT NOT NULL DEFAULT ''",'postcode':"TEXT NOT NULL DEFAULT ''",'company':"TEXT NOT NULL DEFAULT ''",'registration_id':"TEXT NOT NULL DEFAULT ''"}.items():
            if col not in user_columns:c.execute(f'ALTER TABLE users ADD COLUMN {col} {definition}')
        columns={r[1] for r in c.execute('PRAGMA table_info(lead_events)')}
        if 'detail' not in columns: c.execute("ALTER TABLE lead_events ADD COLUMN detail TEXT NOT NULL DEFAULT ''")
        for table, key in [('vehicles','slug'),('dealers','id'),('articles','slug')]:
            for item in json.loads((ROOT / (table+'.json')).read_text()):
                item['dataStatus'] = 'Démonstration — non vérifié'
                c.execute(f'INSERT OR IGNORE INTO {table} VALUES (?,?)', (item[key],json.dumps(item,ensure_ascii=False)))

def password_hash(value):
    salt = secrets.token_hex(16)
    return salt + ':' + hashlib.pbkdf2_hmac('sha256',value.encode(),bytes.fromhex(salt),600000).hex()

def password_matches(value, stored):
    salt, digest = stored.split(':')
    return hmac.compare_digest(digest,hashlib.pbkdf2_hmac('sha256',value.encode(),bytes.fromhex(salt),600000).hex())

def public_user(row):
    return {k: row[k] for k in ['id','email','name','role','dealer_id','account_type','phone','postcode','company','registration_id']}

class Problem(Exception):
    def __init__(self,status,message): self.status,self.message=status,message

def textfield(data,key,minimum=0,maximum=1000):
    value = data.get(key,'')
    if not isinstance(value,str) or not minimum <= len(value.strip()) <= maximum: raise Problem(400,'Champ invalide : '+key)
    return value.strip()

def number(data,key,low,high,default):
    value=data.get(key,default)
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not low <= value <= high: raise Problem(400,'Valeur invalide : '+key)
    return value

def passwordfield(data,key):
    value=data.get(key)
    if not isinstance(value,str) or not 12<=len(value)<=128: raise Problem(400,'Mot de passe : 12 à 128 caractères')
    return value

def project_data(data):
    clean={k:number(data,k,*bounds) for k,bounds in {'budget':(1000,500000,40000),'km':(0,200000,15000),'daily':(0,1000,40),'seats':(1,9,5),'radius':(5,200,50),'monthly':(0,10000,0)}.items()}
    for k,options in {'charging':['home','work','public'],'usage':['city','mixed','highway'],'category':['Toutes','Citadine','Compacte','Berline','SUV','Familiale','Premium'],'horizon':['exploring','3months','6months','year'],'payment':['undecided','cash','finance'],'tradeIn':['undecided','yes','no']}.items():
        if data.get(k) not in options: raise Problem(400,'Choix invalide : '+k)
        clean[k]=data[k]
    clean['postcode']=textfield(data,'postcode',5,5)
    if not re.fullmatch(r'\d{5}',clean['postcode']): raise Problem(400,'Code postal invalide')
    clean['notes']=textfield(data,'notes',0,1000)
    return clean | pilot.passport(data)

class API(BaseHTTPRequestHandler):
    server_version = 'Volteo'
    def log_message(self,*args): pass
    def end_headers(self):
        self.send_header('X-Frame-Options','DENY')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy','camera=(), microphone=(), geolocation=(self)')
        cloud_url=json.loads((ROOT.parent/'src/supabase-config.json').read_text())['url']
        connect="'self' "+cloud_url if STORAGE=='supabase' else "'self'"
        self.send_header('Content-Security-Policy',f"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src {connect}; media-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        self.send_header('X-Robots-Tag','noindex, nofollow')
        if os.environ.get('VOLTEO_SECURE_COOKIE')=='1': self.send_header('Strict-Transport-Security','max-age=31536000')
        super().end_headers()
    def reply(self,status,value,cookie=None):
        raw=json.dumps(value,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        if cookie: self.send_header('Set-Cookie',cookie)
        self.end_headers(); self.wfile.write(raw)
    def cookie(self,token,maxage=604800):
        return f'volteo_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={maxage}' + ('; Secure' if os.environ.get('VOLTEO_SECURE_COOKIE')=='1' else '')
    def body(self):
        try:
            if self.headers.get('Content-Type','').split(';')[0].strip().lower()!='application/json': raise Problem(415,'JSON requis')
            size=int(self.headers.get('Content-Length','0'))
            if size > 65536: raise Problem(413,'Requête trop volumineuse')
            if size < 0: raise ValueError()
            data=json.loads(self.rfile.read(size) or b'{}',parse_constant=lambda v: (_ for _ in ()).throw(ValueError()))
            if not isinstance(data,dict): raise ValueError()
            return data
        except (ValueError,UnicodeDecodeError): raise Problem(400,'JSON invalide')
    def session(self,c,required=True):
        cookie=SimpleCookie()
        try: cookie.load(self.headers.get('Cookie',''))
        except Exception: cookie=SimpleCookie()
        token=cookie.get('volteo_session')
        row=c.execute('SELECT u.*,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=? AND expires>?',(hashlib.sha256((token.value if token else '').encode()).hexdigest(),time.time())).fetchone()
        if required and not row: raise Problem(401,'Connectez-vous pour continuer')
        return row
    def role(self,user,*roles):
        if user['role'] not in roles: raise Problem(403,'Accès réservé')
    def limited(self,c,key,limit=10):
        now=time.time(); c.execute('DELETE FROM attempts WHERE expires<?',(now,)); row=c.execute('SELECT * FROM attempts WHERE key=?',(key,)).fetchone()
        count = row['count']+1 if row and row['expires']>now else 1
        c.execute('INSERT OR REPLACE INTO attempts VALUES (?,?,?)',(key,count,row['expires'] if row and row['expires']>now else now+900));c.commit()
        if count>limit: raise Problem(429,'Trop de tentatives. Réessayez dans 15 minutes.')
    def get_leads(self,c,user):
        where,args=('1=1',[]) if user['role']=='admin' else ('l.dealer_id=?',[user['dealer_id']]) if user['role']=='dealer' else ('l.user_id=?',[user['id']])
        leads = [dict(r)|{'project':json.loads(r['project']) if r['project'] else None} for r in c.execute(f'SELECT l.*,u.name,u.email,d.project,d.consent_version,d.consent_at,d.appointment,d.reply FROM leads l JOIN users u ON u.id=l.user_id LEFT JOIN lead_details d ON d.lead_id=l.id WHERE {where} ORDER BY l.created DESC',args)]
        return pilot.leads_view(c,leads,user)
    def handle_api(self):
        path=urlparse(self.path).path; method=self.command
        if STORAGE == 'supabase':
            if path=='/api/health' and method=='GET':return self.reply(200,{'ok':True,'storage':'supabase','version':'4.6','localApi':False})
            raise Problem(410,'Cette version utilise Supabase. L’ancienne API locale est désactivée.')
        with db() as c:
            user=self.session(c,False)
            if method!='GET':
                if self.headers.get('Origin')!=ORIGIN: raise Problem(403,'Origine de requête refusée')
                if user and not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),user['csrf']): raise Problem(403,'Session expirée : rechargez la page')
                data=self.body()
            if pilot.handle(self,c,user,path,method,data if method!='GET' else {},parse_qs(urlparse(self.path).query)):return
            if path in ['/api/location','/api/nearby/fuel','/api/nearby/dealers','/api/nearby/charging'] and method=='GET':
                self.limited(c,'geo:'+self.client_address[0],40)
                query=parse_qs(urlparse(self.path).query)
                try:
                    if path=='/api/location':
                        code=query.get('postcode',[''])[0]
                        if not re.fullmatch(r'\d{5}',code):raise Problem(400,'Saisissez un code postal français de 5 chiffres')
                        return self.reply(200,geo.postal(code))
                    lat=float(query.get('lat',[''])[0]);lon=float(query.get('lon',[''])[0]);radius=float(query.get('radius',['10'])[0])
                    if not -90<=lat<=90 or not -180<=lon<=180 or radius not in [5,10,15,20,25,30,50]:raise ValueError()
                    result=geo.stations(lat,lon,radius) if path.endswith('/fuel') else geo.charging(lat,lon,radius) if path.endswith('/charging') else geo.dealers(lat,lon,radius)
                    return self.reply(200,result)
                except (ValueError,OverflowError):raise Problem(400,'Position ou rayon invalide')
                except geo.SourceError as e:raise Problem(503,str(e))
            if path=='/api/health' and method=='GET': return self.reply(200,{'ok':True,'storage':'sqlite','version':'4.5'})
            if path in ['/api/vehicles','/api/dealers','/api/articles'] and method=='GET':
                table=path.split('/')[-1]; return self.reply(200,[json.loads(r['data']) for r in c.execute(f'SELECT data FROM {table}')])
            if path=='/api/session' and method=='GET': return self.reply(200,{'user':public_user(user) if user else None,'csrf':user['csrf'] if user else None})
            if path in ['/api/register','/api/login'] and method=='POST':
                email=textfield(data,'email',3,254).lower(); password=passwordfield(data,'password')
                if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email): raise Problem(400,'Adresse email invalide')
                self.limited(c,'auth-ip:'+self.client_address[0],40); self.limited(c,'auth-email:'+email)
                row=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
                if path=='/api/register':
                    if row: raise Problem(400,'Inscription impossible avec cette adresse')
                    kind=data.get('account_type','buyer')
                    if kind not in ['buyer','pro']:raise Problem(400,'Type de compte invalide')
                    postcode=textfield(data,'postcode',0,5);phone=textfield(data,'phone',0,25)
                    if postcode and not re.fullmatch(r'\d{5}',postcode):raise Problem(400,'Code postal invalide')
                    if phone and not re.fullmatch(r'[+\d\s().-]{8,25}',phone):raise Problem(400,'Téléphone invalide')
                    company=textfield(data,'company',2 if kind=='pro' else 0,120) if kind=='pro' else ''
                    registration_id=textfield(data,'registration_id',9 if kind=='pro' else 0,14) if kind=='pro' else ''
                    if kind=='pro' and (not re.fullmatch(r'(\d{9}|\d{14})',registration_id) or not postcode or not phone):raise Problem(400,'Coordonnées professionnelles incomplètes')
                    if 'account_type' in data and (not postcode or data.get('privacy_ack') is not True):raise Problem(400,'Code postal et lecture de la notice requis')
                    uid=secrets.token_hex(16)
                    c.execute('INSERT INTO users(id,email,name,password,created) VALUES (?,?,?,?,?)',(uid,email,textfield(data,'name',2,80),password_hash(password),time.time()))
                    c.execute('UPDATE users SET account_type=?,postcode=?,phone=?,company=?,registration_id=? WHERE id=?',(kind,postcode,phone,company,registration_id,uid))
                    row=c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
                elif not password_matches(password,row['password'] if row else '00'*16+':'+'00'*32): raise Problem(401,'Identifiants incorrects')
                c.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
                token=secrets.token_urlsafe(32); csrf=secrets.token_urlsafe(32)
                c.execute('INSERT INTO sessions VALUES (?,?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),row['id'],csrf,time.time()+604800));c.commit()
                return self.reply(200,{'user':public_user(row),'csrf':csrf},self.cookie(token))
            if not user: raise Problem(401,'Connectez-vous pour continuer')
            uid=user['id']
            if method!='GET': self.limited(c,'write:'+uid,100)
            if (user['account_type']=='pro' or user['role'] in ['dealer','admin']) and path in ['/api/profile','/api/project','/api/leads'] and method in ['POST','PUT']:raise Problem(403,'Cette action appartient au parcours acheteur')
            if path=='/api/logout' and method=='POST':
                c.execute('DELETE FROM sessions WHERE user_id=? AND csrf=?',(uid,user['csrf']));c.commit();return self.reply(200,{'ok':True},self.cookie('',0))
            if path=='/api/password' and method=='POST':
                if not password_matches(passwordfield(data,'current'),user['password']): raise Problem(401,'Mot de passe actuel incorrect')
                c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(passwordfield(data,'password')),uid));c.execute('DELETE FROM sessions WHERE user_id=?',(uid,));c.commit()
                return self.reply(200,{'ok':True},self.cookie('',0))
            if path=='/api/me' and method=='GET':
                profile=c.execute('SELECT data FROM profiles WHERE user_id=?',(uid,)).fetchone()
                project=c.execute('SELECT data FROM buyer_projects WHERE user_id=?',(uid,)).fetchone()
                return self.reply(200,{'project':json.loads(project['data']) if project else None,'profile':json.loads(profile['data']) if profile else None,'favorites':[r[0] for r in c.execute('SELECT vehicle_slug FROM favorites WHERE user_id=?',(uid,))],'simulations':[dict(r)|{'data':json.loads(r['data'])} for r in c.execute('SELECT * FROM simulations WHERE user_id=? ORDER BY created DESC',(uid,))],'leads':self.get_leads(c,user)})
            if path=='/api/project' and method in ['GET','PUT','DELETE']:
                if method=='GET':
                    row=c.execute('SELECT data,updated FROM buyer_projects WHERE user_id=?',(uid,)).fetchone()
                    return self.reply(200,{'project':json.loads(row['data']) if row else None,'updated':row['updated'] if row else None})
                if method=='DELETE':
                    c.execute('DELETE FROM buyer_projects WHERE user_id=?',(uid,));c.commit();return self.reply(200,{'ok':True})
                clean=project_data(data);now=time.time()
                c.execute('INSERT OR REPLACE INTO buyer_projects VALUES (?,?,?)',(uid,json.dumps(clean),now))
                shared={k:clean[k] for k in ['km','daily','budget','seats','charging','usage','category']}
                c.execute('INSERT OR REPLACE INTO profiles VALUES (?,?)',(uid,json.dumps(shared)))
                c.execute('UPDATE users SET postcode=? WHERE id=?',(clean['postcode'],uid));c.commit();return self.reply(200,{'project':clean,'updated':now})
            if path=='/api/profile'  and method=='PUT':
                profile={k:number(data,k,*limits) for k,limits in {'km':(0,200000,15000),'budget':(1000,500000,40000),'daily':(0,1000,40),'seats':(1,9,5)}.items()}
                for k,options in {'charging':['home','work','public'],'usage':['city','mixed','highway'],'category':['Toutes','Citadine','Compacte','Berline','SUV','Familiale','Premium']}.items():
                    if data.get(k) not in options: raise Problem(400,'Choix invalide : '+k)
                    profile[k]=data[k]
                c.execute('INSERT OR REPLACE INTO profiles VALUES (?,?)',(uid,json.dumps(profile)))
                existing=c.execute('SELECT data FROM buyer_projects WHERE user_id=?',(uid,)).fetchone()
                if existing:c.execute('UPDATE buyer_projects SET data=?,updated=? WHERE user_id=?',(json.dumps(json.loads(existing['data'])|profile),time.time(),uid))
                c.commit();return self.reply(200,profile)
            if path.startswith('/api/favorites/') and method in ['PUT','DELETE']:
                slug=path.split('/')[-1]
                if not c.execute('SELECT 1 FROM vehicles WHERE slug=?',(slug,)).fetchone(): raise Problem(404,'Véhicule introuvable')
                if method=='PUT': c.execute('INSERT OR IGNORE INTO favorites VALUES (?,?)',(uid,slug))
                else: c.execute('DELETE FROM favorites WHERE user_id=? AND vehicle_slug=?',(uid,slug))
                c.commit();return self.reply(200,{'ok':True})
            if path=='/api/simulations' and method=='POST':
                # Only numeric user assumptions, never trust client HTML or claimed totals.
                allowed={'km':(0,200000,15000),'years':(1,15,5),'fuel':(0,10,1.85),'liters':(0,40,6),'homeRate':(0,10,.25),'publicRate':(0,10,.6),'homeShare':(0,100,80),'electricMaintenance':(0,10000,350),'thermalMaintenance':(0,10000,700),'electricInsurance':(0,10000,700),'thermalInsurance':(0,10000,650),'thermalValue':(0,500000,15000),'thermalResale':(0,500000,6000),'electricResale':(0,500000,18000),'deposit':(0,500000,5000),'months':(1,120,60),'apr':(0,30,4),'installation':(0,20000,1200)}
                clean={k:number(data,k,*v) for k,v in allowed.items()};clean['vehicle']=textfield(data,'vehicle',1,100);clean['fuelSource']=textfield(data,'fuelSource',0,500)
                vehicle_row=c.execute('SELECT data FROM vehicles WHERE slug=?',(clean['vehicle'],)).fetchone()
                if not vehicle_row: raise Problem(400,'Véhicule invalide')
                price=json.loads(vehicle_row['data'])['priceMin']
                if clean['deposit']>price or clean['electricResale']>price or clean['thermalResale']>clean['thermalValue']: raise Problem(400,'Apport ou valeur de revente incohérente')
                self.limited(c,'sim:'+uid,100)
                sid=secrets.token_hex(12);c.execute('INSERT INTO simulations VALUES (?,?,?,?)',(sid,uid,json.dumps(clean),time.time()));c.commit();return self.reply(201,{'id':sid})
            if path=='/api/leads' and method=='POST':
                self.limited(c,'lead:'+uid,10)
                slug=textfield(data,'vehicle',1,100);dealer_id=data.get('dealer_id')
                if type(dealer_id) is not int: raise Problem(400,'Concession invalide')
                vehicle=c.execute('SELECT data FROM vehicles WHERE slug=?',(slug,)).fetchone();dealer=c.execute('SELECT data FROM dealers WHERE id=?',(dealer_id,)).fetchone()
                if not vehicle or not dealer or not json.loads(dealer['data']).get('essai') or json.loads(vehicle['data'])['brand'] not in json.loads(dealer['data'])['brands']: raise Problem(400,'Cette concession ne propose pas ce véhicule en essai')
                if data.get('consent') is not True: raise Problem(400,'Autorisez la transmission à la concession choisie')
                phone=textfield(data,'phone',8,25)
                if not re.fullmatch(r'[+\d\s().-]{8,25}',phone): raise Problem(400,'Téléphone invalide')
                trial=pilot.trial_data(c,data,slug,dealer_id)
                if json.loads(dealer['data']).get('pilot') and not data.get('offer_id'):raise Problem(400,'Choisissez une offre locale active de ce partenaire')
                snapshot=None
                if data.get('share_project') is True:
                    saved=c.execute('SELECT data FROM buyer_projects WHERE user_id=?',(uid,)).fetchone()
                    if not saved: raise Problem(400,'Enregistrez votre dossier avant de le partager')
                    snapshot=saved['data']
                lid=secrets.token_hex(12);now=time.time()
                c.execute('INSERT INTO leads VALUES (?,?,?,?,?,?,?,?,?)',(lid,uid,slug,dealer_id,textfield(data,'message',0,2000),phone,'Nouveau',now,now))
                c.execute('INSERT INTO lead_details(lead_id,project,consent_version,consent_at) VALUES (?,?,?,?)',(lid,snapshot,'trial-v2-project' if snapshot else 'trial-v2-contact',now))
                c.execute('UPDATE lead_details SET trial=?,attendance_code=? WHERE lead_id=?',(json.dumps(trial),str(secrets.randbelow(1000000)).zfill(6),lid))
                c.execute('INSERT INTO lead_events(lead_id,actor,status,created) VALUES (?,?,?,?)',(lid,uid,'Nouveau',now));c.commit();return self.reply(201,{'id':lid})
            if path=='/api/leads' and method=='GET': return self.reply(200,self.get_leads(c,user))
            if path.startswith('/api/leads/') and method in ['PATCH','GET','DELETE']:
                lid=path.split('/')[-1];lead=c.execute('SELECT * FROM leads WHERE id=?',(lid,)).fetchone()
                if not lead: raise Problem(404,'Demande introuvable')
                if not (user['role']=='admin' or user['role']=='dealer' and user['dealer_id']==lead['dealer_id'] or method in ['GET','DELETE'] and lead['user_id']==uid): raise Problem(403,'Accès réservé')
                if method=='GET': return self.reply(200,[dict(r) for r in c.execute('SELECT status,created,detail FROM lead_events WHERE lead_id=? ORDER BY id',(lid,))])
                if method=='DELETE':
                    c.execute('DELETE FROM leads WHERE id=?',(lid,));c.commit();return self.reply(200,{'ok':True})
                status=data.get('status')
                if status not in STATUSES: raise Problem(400,'Statut invalide')
                if data.get('expected_updated')!=lead['updated']: raise Problem(409,'Cette demande a été modifiée. Rechargez la liste.')
                reply=textfield(data,'reply',0,1000)
                appointment=data.get('appointment')
                if status=='Essai planifié':
                    if isinstance(appointment,bool) or not isinstance(appointment,(int,float)) or not math.isfinite(appointment) or not time.time()<appointment<time.time()+366*86400: raise Problem(400,'Choisissez un créneau futur dans les 12 prochains mois')
                else:
                    previous=c.execute('SELECT appointment FROM lead_details WHERE lead_id=?',(lid,)).fetchone()
                    appointment=previous['appointment'] if previous else None
                previous_detail=c.execute('SELECT appointment,attended_at FROM lead_details WHERE lead_id=?',(lid,)).fetchone()
                if previous_detail and previous_detail['attended_at'] and (status!='Terminé' or appointment!=previous_detail['appointment']):raise Problem(400,'Un essai confirmé ne peut plus être replanifié ou fermé')
                if status=='Essai planifié' and previous_detail and appointment!=previous_detail['appointment']:
                    c.execute('UPDATE lead_details SET attendance_code=? WHERE lead_id=?',(str(secrets.randbelow(1000000)).zfill(6),lid))
                now=time.time();updated=c.execute('UPDATE leads SET status=?,updated=? WHERE id=? AND updated=?',(status,now,lid,lead['updated']))
                if updated.rowcount!=1: raise Problem(409,'Cette demande a été modifiée. Rechargez la liste.')
                c.execute("INSERT INTO lead_details(lead_id,project,consent_version,consent_at,appointment,reply) VALUES (?,NULL,'legacy',?,?,?) ON CONFLICT(lead_id) DO UPDATE SET appointment=excluded.appointment,reply=excluded.reply",(lid,lead['created'],appointment,reply))
                detail=json.dumps({'appointment':appointment,'reply':reply})
                c.execute('INSERT INTO lead_events(lead_id,actor,status,created,detail) VALUES (?,?,?,?,?)',(lid,uid,status,now,detail));c.commit();return self.reply(200,{'ok':True})
            if path=='/api/export' and method=='GET':
                result={'user':public_user(user),'profile':[dict(r) for r in c.execute('SELECT data FROM profiles WHERE user_id=?',(uid,))],'favorites':[dict(r) for r in c.execute('SELECT vehicle_slug FROM favorites WHERE user_id=?',(uid,))],'simulations':[dict(r) for r in c.execute('SELECT id,data,created FROM simulations WHERE user_id=?',(uid,))],'leads':[dict(r) for r in c.execute('SELECT * FROM leads WHERE user_id=?',(uid,))]}
                result['project']=[dict(r) for r in c.execute('SELECT data,updated FROM buyer_projects WHERE user_id=?',(uid,))]
                result['lead_details']=[dict(r) for r in c.execute('SELECT d.* FROM lead_details d JOIN leads l ON l.id=d.lead_id WHERE l.user_id=?',(uid,))]
                result['pilot_enrollment']=[dict(r) for r in c.execute('SELECT data,created,updated FROM pilot_enrollments WHERE user_id=?',(uid,))]
                return self.reply(200,result)
            if path=='/api/account' and method=='DELETE':
                if not password_matches(passwordfield(data,'password'),user['password']): raise Problem(401,'Mot de passe incorrect')
                c.execute('DELETE FROM users WHERE id=?',(uid,));c.commit();return self.reply(200,{'ok':True},self.cookie('',0))
            if path=='/api/admin/users' and method=='GET':
                self.role(user,'admin');return self.reply(200,[public_user(r) for r in c.execute('SELECT * FROM users')])
            if path.startswith('/api/admin/users/') and method=='PATCH':
                self.role(user,'admin');target=path.split('/')[-1]
                if target==uid: raise Problem(400,'Votre propre rôle ne peut pas être modifié ici')
                role=data.get('role');dealer_id=data.get('dealer_id') if role=='dealer' else None
                if role not in ['user','dealer','admin']: raise Problem(400,'Rôle invalide')
                if role=='dealer' and type(dealer_id) is not int: raise Problem(400,'Concession invalide')
                if role=='dealer' and not c.execute('SELECT 1 FROM dealers WHERE id=?',(dealer_id,)).fetchone(): raise Problem(400,'Concession requise')
                if not c.execute('SELECT 1 FROM users WHERE id=?',(target,)).fetchone(): raise Problem(404,'Compte introuvable')
                c.execute('UPDATE users SET role=?,dealer_id=? WHERE id=?',(role,dealer_id,target));c.execute('DELETE FROM sessions WHERE user_id=?',(target,));c.commit();return self.reply(200,{'ok':True})
            if path.startswith('/api/admin/vehicles/') and method=='PUT':
                self.role(user,'admin');slug=path.split('/')[-1]
                existing=c.execute('SELECT data FROM vehicles WHERE slug=?',(slug,)).fetchone()
                if not existing: raise Problem(404,'Véhicule introuvable')
                vehicle=json.loads(existing['data'])
                for key,limits in {'priceMin':(0,1000000,0),'priceMax':(0,1000000,0),'autonomy':(1,2000,1),'conso':(1,100,1),'fastKW':(0,1000,0)}.items(): vehicle[key]=number(data,key,*limits)
                if vehicle['priceMax']<vehicle['priceMin']: raise Problem(400,'Fourchette de prix invalide')
                vehicle['source']=textfield(data,'source',0,500);vehicle['updatedAt']=time.strftime('%Y-%m-%d');vehicle['dataStatus']='Démonstration — non vérifié'
                c.execute('UPDATE vehicles SET data=? WHERE slug=?',(json.dumps(vehicle),slug));c.commit();return self.reply(200,vehicle)
            raise Problem(404,'Route introuvable')
    def serve_frontend(self):
        root=ROOT.parent / 'dist'
        requested=(root / unquote(urlparse(self.path).path).lstrip('/')).resolve()
        if not requested.is_relative_to(root.resolve()): raise Problem(403,'Chemin refusé')
        urlpath=unquote(urlparse(self.path).path)
        if any(part.startswith('.') for part in Path(urlpath).parts) or '\x00' in urlpath: raise Problem(404,'Fichier introuvable')
        routes=['/sources','/pilote','/passeport','/offres-locales','/stock','/parametres','/','/catalogue','/diagnostic','/projet','/comparateur','/simulateur','/recharge','/guides','/autour-de-moi','/credits-photos','/connexion','/compte','/professionnel','/partenaires','/admin','/confidentialite']
        if not requested.is_file() and urlpath not in routes and not re.fullmatch(r'/vehicules/[a-z0-9-]+',urlpath): raise Problem(404,'Page introuvable')
        target=requested if requested.is_file() else root / 'index.html'
        if not target.is_file(): raise Problem(404,'Lancez npm run build avant de servir le site')
        raw=target.read_bytes();self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(target)[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','public, max-age=31536000, immutable' if '/assets/' in self.path else 'no-cache')
        self.end_headers();self.wfile.write(raw)
    def dispatch(self):
        try:
            if self.command=='GET' and not self.path.startswith('/api/') and getattr(self.server,'serve_frontend',False): self.serve_frontend()
            else: self.handle_api()
        except Problem as e: self.reply(e.status,{'error':e.message})
        except Exception: self.reply(500,{'error':'Erreur du serveur. Réessayez.'})
    do_GET=do_POST=do_PUT=do_PATCH=do_DELETE=dispatch

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--promote-admin');parser.add_argument('--serve',action='store_true');args=parser.parse_args();initialize()
    if args.promote_admin:
        if STORAGE=='supabase':raise SystemExit('Attribuez le premier rôle administrateur depuis Supabase SQL Editor ; voir SUPABASE.md. Aucune clé serveur n’est nécessaire dans le ZIP.')
        with db() as c:
            row=c.execute('SELECT id FROM users WHERE email=?',(args.promote_admin.lower(),)).fetchone()
            if not row: raise SystemExit('Créez d’abord ce compte dans le site.')
            c.execute("UPDATE users SET role='admin',dealer_id=NULL WHERE id=?",(row['id'],));c.execute('DELETE FROM sessions WHERE user_id=?',(row['id'],))
        print('Administrateur activé. Reconnectez-vous.')
    else:
        print('VOLTÉO API: http://127.0.0.1:'+os.environ.get('VOLTEO_PORT','8080'))
        if args.serve and 'VOLTEO_ORIGIN' not in os.environ: ORIGIN='http://localhost:'+os.environ.get('VOLTEO_PORT','8080')
        server=ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('VOLTEO_PORT','8080'))),API);server.serve_frontend=args.serve;server.serve_forever()
