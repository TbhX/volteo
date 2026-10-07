"""Local pilot: explicit partner validation, dated inventory, private buyer feedback."""
import json, re, secrets, time
from pathlib import Path
import geo
CONFIG=json.loads((Path(__file__).resolve().parents[1]/'pilot-config.json').read_text())
PASSPORT_DEFAULTS={'parking':'unknown','chargingReady':'unknown','longTrip':300,'winterMargin':30,'primaryStation':'','primarySource':'','backupStation':'','backupSource':'','chargeChecked':'','chargeRate':0.25,'chargePower':7.4,'chargeSessions':2,'detourMinutes':0,'chargingNotes':'','trialPriorities':[]}
PRIORITIES=['Autoroute','Stationnement','Coffre','Sièges enfants','Accessibilité','Recharge','Confort']
OUTCOMES=['pursue','compare','pause','purchased']
REASONS=['none','budget','charging','range','comfort','availability','timing','other']

def initialize(c):
    c.executescript('''
    CREATE TABLE IF NOT EXISTS pilot_settings(id INTEGER PRIMARY KEY CHECK(id=1),radius INTEGER NOT NULL,updated REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS pilot_partners(dealer_id INTEGER PRIMARY KEY REFERENCES dealers(id),data TEXT NOT NULL,updated REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS pilot_offers(id TEXT PRIMARY KEY,dealer_id INTEGER NOT NULL REFERENCES dealers(id),vehicle_slug TEXT NOT NULL REFERENCES vehicles(slug),data TEXT NOT NULL,updated REAL NOT NULL);
    CREATE INDEX IF NOT EXISTS pilot_offer_dealer ON pilot_offers(dealer_id);
    CREATE TABLE IF NOT EXISTS pilot_enrollments(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL,created REAL NOT NULL,updated REAL NOT NULL);
    ''')
    cols={r[1] for r in c.execute('PRAGMA table_info(lead_details)')}
    for col,definition in {'trial':"TEXT NOT NULL DEFAULT '{}'",'feedback':"TEXT NOT NULL DEFAULT '{}'",'attendance_code':"TEXT NOT NULL DEFAULT ''",'attended_at':'REAL'}.items():
        if col not in cols:c.execute(f'ALTER TABLE lead_details ADD COLUMN {col} {definition}')

def config(c):
    row=c.execute('SELECT radius FROM pilot_settings WHERE id=1').fetchone()
    return CONFIG|{'radius':row['radius'] if row else CONFIG['radius']}

def passport(data):
    from app import Problem,textfield,number
    clean={}
    for key,options in {'parking':['unknown','private','shared','street'],'chargingReady':['unknown','confirmed','unavailable']}.items():
        value=data.get(key,PASSPORT_DEFAULTS[key])
        if value not in options:raise Problem(400,'Choix invalide : '+key)
        clean[key]=value
    for key,limits in {'longTrip':(0,3000,300),'winterMargin':(20,50,30),'chargeRate':(0,10,.25),'chargePower':(.5,350,7.4),'chargeSessions':(1,14,2),'detourMinutes':(0,240,0)}.items():clean[key]=number(data,key,*limits)
    for key in ['primaryStation','backupStation','primarySource','backupSource','chargingNotes']:clean[key]=textfield(data,key,0,500)
    for key in ['primarySource','backupSource']:
        if clean[key] and not geo.safe_url(clean[key]):raise Problem(400,'Lien de source invalide')
    date=textfield(data,'chargeChecked',0,10)
    if date:
        import datetime
        try:
            checked=datetime.date.fromisoformat(date)
            if checked>datetime.date.today():raise ValueError()
        except ValueError:raise Problem(400,'Date de vérification invalide')
    clean['chargeChecked']=date
    priorities=data.get('trialPriorities',[])
    if not isinstance(priorities,list) or len(priorities)>7 or any(x not in PRIORITIES for x in priorities):raise Problem(400,'Priorités d’essai invalides')
    clean['trialPriorities']=list(dict.fromkeys(priorities))
    return clean

def partner(c,dealer_id):
    row=c.execute('SELECT * FROM pilot_partners WHERE dealer_id=?',(dealer_id,)).fetchone()
    return json.loads(row['data'])|{'dealer_id':dealer_id,'updated':row['updated']} if row else None

def eligible_partner(c,p):
    cfg=config(c)
    return bool(p and p.get('status')=='verified' and geo.distance(cfg['lat'],cfg['lon'],p['lat'],p['lon'])<=cfg['radius'])

def offer(c,row,private=False):
    if not row:return None
    o=json.loads(row['data'])|{'id':row['id'],'dealer_id':row['dealer_id'],'vehicle_slug':row['vehicle_slug'],'updated':row['updated']}
    p=partner(c,row['dealer_id']);cfg=config(c)
    fresh=o['valid_until']>time.time() and row['updated']>=time.time()-7*86400
    visible=o['status']=='published' and fresh and eligible_partner(c,p)
    if not private and not visible:return None
    return o|{'fresh':fresh,'visible':visible,'partner':{k:p[k] for k in ['name','city','address','lat','lon','verified_at']} if p else None,'pilot_distance':geo.distance(cfg['lat'],cfg['lon'],p['lat'],p['lon']) if p else None}

def trial_data(c,data,slug,dealer_id):
    from app import Problem,textfield
    trial=data.get('trial',{})
    if not isinstance(trial,dict):raise Problem(400,'Préparation d’essai invalide')
    priorities=trial.get('priorities',[])
    if not isinstance(priorities,list) or len(priorities)>7 or any(x not in PRIORITIES for x in priorities):raise Problem(400,'Priorités invalides')
    clean={'priorities':list(dict.fromkeys(priorities)),'route':textfield(trial,'route',0,600)}
    offer_id=textfield(data,'offer_id',0,60)
    if offer_id:
        item=offer(c,c.execute('SELECT * FROM pilot_offers WHERE id=?',(offer_id,)).fetchone())
        if not item or item['dealer_id']!=dealer_id or item['vehicle_slug']!=slug:raise Problem(409,'Cette offre n’est plus disponible. Actualisez les offres locales.')
        clean['offer']={k:item[k] for k in ['id','trim','cash_price','fees','availability','valid_until','updated','terms']}
    clean['mode']='partner' if offer_id else 'demo'
    return clean

def leads_view(c,leads,user):
    for lead in leads:
        row=c.execute('SELECT trial,feedback,attendance_code,attended_at FROM lead_details WHERE lead_id=?',(lead['id'],)).fetchone()
        if not row:continue
        feedback=json.loads(row['feedback']);owner=lead['user_id']==user['id']
        lead.update(trial=json.loads(row['trial']),feedback=feedback if owner or feedback.get('shared') is True else {},attended_at=row['attended_at'])
        if owner and lead.get('appointment') and time.time()>=lead['appointment']-7200 and time.time()<=lead['appointment']+172800:lead['attendance_code']=row['attendance_code']
    return leads

def handle(api,c,user,path,method,data,query):
    from app import Problem,textfield,number
    if not path.startswith('/api/pilot'):return False
    if path=='/api/pilot' and method=='GET':api.reply(200,config(c));return True
    if path=='/api/pilot/offers' and method=='GET':
        items=[offer(c,row) for row in c.execute('SELECT * FROM pilot_offers ORDER BY updated DESC')]
        api.reply(200,[x for x in items if x]);return True
    if path=='/api/pilot/eligibility' and method=='GET':
        api.limited(c,'geo:'+api.client_address[0],40)
        postcode=query.get('postcode',[''])[0]
        if not re.fullmatch(r'\d{5}',postcode):raise Problem(400,'Code postal invalide')
        try: cities=geo.cached(('postal',postcode),86400,lambda:geo.postal(postcode))
        except geo.SourceError as e:raise Problem(503,str(e))
        cfg=config(c)
        api.reply(200,[x|{'postcode':postcode,'distance':geo.distance(cfg['lat'],cfg['lon'],x['lat'],x['lon']),'eligible':geo.distance(cfg['lat'],cfg['lon'],x['lat'],x['lon'])<=cfg['radius']} for x in cities]);return True
    if not user:raise Problem(401,'Connectez-vous pour continuer')
    uid=user['id']
    if method!='GET':api.limited(c,'write:'+uid,100)
    if path=='/api/pilot/settings' and method=='PUT':
        api.role(user,'admin');radius=data.get('radius')
        if type(radius) is not int or radius not in CONFIG['radii']:raise Problem(400,'Rayon invalide')
        c.execute('INSERT OR REPLACE INTO pilot_settings VALUES (1,?,?)',(radius,time.time()));c.commit();api.reply(200,config(c));return True
    if path=='/api/pilot/enrollment':
        if user['account_type']=='pro' or user['role']!='user':raise Problem(403,'Inscription réservée aux acheteurs')
        row=c.execute('SELECT data,created,updated FROM pilot_enrollments WHERE user_id=?',(uid,)).fetchone()
        if method=='GET':api.reply(200,json.loads(row['data'])|{'updated':row['updated']} if row else None);return True
        if method=='DELETE':c.execute('DELETE FROM pilot_enrollments WHERE user_id=?',(uid,));c.commit();api.reply(200,{'ok':True});return True
        if method=='PUT':
            if data.get('consent') is not True:raise Problem(400,'Confirmez votre participation au pilote')
            code=textfield(data,'city_code',5,5);postcode=textfield(data,'postcode',5,5)
            if not re.fullmatch(r'\d{5}',postcode):raise Problem(400,'Code postal invalide')
            try:cities=geo.cached(('postal',postcode),86400,lambda:geo.postal(postcode))
            except geo.SourceError as e:raise Problem(503,str(e))
            city=next((x for x in cities if x['code']==code),None)
            if not city:raise Problem(400,'Choisissez une commune correspondant au code postal')
            source=data.get('source','other')
            if source not in ['meta','google','friend','dealer','other']:raise Problem(400,'Origine invalide')
            cfg=config(c);distance=geo.distance(cfg['lat'],cfg['lon'],city['lat'],city['lon']);now=time.time()
            clean={'city':city['name'],'city_code':code,'postcode':postcode,'distance':distance,'status':'pilot' if distance<=cfg['radius'] else 'outside','source':source,'consent_at':now,'consent_version':'pilot-interest-v1','radius_at_signup':cfg['radius']}
            c.execute('INSERT INTO pilot_enrollments VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated=excluded.updated',(uid,json.dumps(clean),now,now));c.commit();api.reply(200,clean);return True
    if path=='/api/pilot/partners' and method in ['GET','PUT']:
        api.role(user,'admin')
        if method=='GET':api.reply(200,[json.loads(r['data'])|{'dealer_id':r['dealer_id'],'updated':r['updated']} for r in c.execute('SELECT * FROM pilot_partners')]);return True
        dealer_id=data.get('dealer_id');old=partner(c,dealer_id) if type(dealer_id) is int else None
        if old and data.get('expected_updated')!=old['updated']:raise Problem(409,'Établissement modifié. Rechargez.')
        clean={k:textfield(data,k,*limits) for k,limits in {'name':(2,120),'city':(2,120),'address':(5,300),'evidence':(10,1000)}.items()}
        clean['lat']=number(data,'lat',-90,90,CONFIG['lat']);clean['lon']=number(data,'lon',-180,180,CONFIG['lon'])
        clean['status']=data.get('status')
        if clean['status'] not in ['pending','verified','suspended']:raise Problem(400,'Statut partenaire invalide')
        if clean['status']=='verified' and data.get('verification_ack') is not True:raise Problem(400,'Confirmez la vérification de l’identité, de l’adresse et de l’accord de partenariat')
        now=time.time();clean['verified_at']=now if clean['status']=='verified' else None
        brands=data.get('brands',[])
        validbrands={json.loads(r['data'])['brand'] for r in c.execute('SELECT data FROM vehicles')}
        if not isinstance(brands,list) or not brands or any(not isinstance(b,str) or b not in validbrands for b in brands):raise Problem(400,'Choisissez les marques représentées')
        clean['brands']=list(dict.fromkeys(brands))
        if dealer_id is None:
            dealer_id=c.execute('SELECT COALESCE(MAX(id),0)+1 FROM dealers').fetchone()[0]
            c.execute('INSERT INTO dealers VALUES (?,?)',(dealer_id,'{}'))
        elif type(dealer_id) is not int or not c.execute('SELECT 1 FROM dealers WHERE id=?',(dealer_id,)).fetchone():raise Problem(400,'Établissement introuvable')
        # The public registry contains no verification notes or buyer information.
        public={k:clean[k] for k in ['name','city','address','lat','lon','brands']}
        public.update(id=dealer_id,essai=clean['status']=='verified',partenaire=clean['status']=='verified',pilot=True,dataStatus='Partenaire validé manuellement' if clean['status']=='verified' else 'Partenaire non actif')
        c.execute('UPDATE dealers SET data=? WHERE id=?',(json.dumps(public),dealer_id))
        if old:
            changed=c.execute('UPDATE pilot_partners SET data=?,updated=? WHERE dealer_id=? AND updated=?',(json.dumps(clean),now,dealer_id,old['updated']))
            if changed.rowcount!=1:raise Problem(409,'Établissement modifié. Rechargez.')
        else:c.execute('INSERT INTO pilot_partners VALUES (?,?,?)',(dealer_id,json.dumps(clean),now))
        c.commit();api.reply(200,partner(c,dealer_id));return True
    if path=='/api/pilot/inventory' or path.startswith('/api/pilot/inventory/'):
        api.role(user,'dealer','admin')
        if method=='GET' and path=='/api/pilot/inventory':
            rows=c.execute('SELECT * FROM pilot_offers'+(' WHERE dealer_id=?' if user['role']=='dealer' else '')+' ORDER BY updated DESC',(user['dealer_id'],) if user['role']=='dealer' else ())
            api.reply(200,[offer(c,row,True) for row in rows]);return True
        if method in ['POST','PUT']:
            old=c.execute('SELECT * FROM pilot_offers WHERE id=?',(path.split('/')[-1],)).fetchone() if method=='PUT' else None
            if method=='PUT' and not old:raise Problem(404,'Offre introuvable')
            dealer_id=old['dealer_id'] if old else user['dealer_id'] if user['role']=='dealer' else data.get('dealer_id')
            if user['role']=='dealer' and dealer_id!=user['dealer_id']:raise Problem(403,'Accès réservé')
            if old and data.get('expected_updated')!=old['updated']:raise Problem(409,'Offre modifiée. Rechargez.')
            p=partner(c,dealer_id)
            if not eligible_partner(c,p):raise Problem(400,'Un partenaire validé dans le rayon du pilote est requis')
            slug=textfield(data,'vehicle_slug',1,100);v=c.execute('SELECT data FROM vehicles WHERE slug=?',(slug,)).fetchone()
            if not v or json.loads(v['data'])['brand'] not in p['brands']:raise Problem(400,'Véhicule incompatible avec les marques de l’établissement')
            clean={k:textfield(data,k,*limits) for k,limits in {'trim':(3,200),'availability':(3,300),'terms':(3,1000),'source':(5,500)}.items()}
            clean['cash_price']=number(data,'cash_price',1000,1000000,0);clean['fees']=number(data,'fees',0,100000,0)
            clean['status']=data.get('status','published')
            if clean['status'] not in ['published','withdrawn']:raise Problem(400,'Statut offre invalide')
            if data.get('stock_ack') is not True:raise Problem(400,'Confirmez prix, frais obligatoires et disponibilité')
            now=time.time();days=number(data,'valid_days',1,7,7);clean['valid_until']=now+days*86400
            oid=old['id'] if old else secrets.token_hex(12)
            if old:
                changed=c.execute('UPDATE pilot_offers SET vehicle_slug=?,data=?,updated=? WHERE id=? AND updated=?',(slug,json.dumps(clean),now,oid,old['updated']))
                if changed.rowcount!=1:raise Problem(409,'Offre modifiée. Rechargez.')
            else:c.execute('INSERT INTO pilot_offers VALUES (?,?,?,?,?)',(oid,dealer_id,slug,json.dumps(clean),now))
            c.commit();api.reply(200,offer(c,c.execute('SELECT * FROM pilot_offers WHERE id=?',(oid,)).fetchone(),True));return True
    if path=='/api/pilot/dashboard' and method=='GET':
        api.role(user,'dealer','admin');all_leads=api.get_leads(c,user);leads=[l for l in all_leads if l.get('trial',{}).get('mode')=='partner']
        counts={key:sum(1 for l in leads if l['status']==key) for key in ['Nouveau','Contacté','Essai planifié','Terminé','Fermé']}
        reasons={key:sum(1 for l in leads if l.get('feedback',{}).get('reason')==key) for key in REASONS if key!='none'}
        result={'demo_count':len(all_leads)-len(leads),'total':len(leads),'statuses':counts,'attended':sum(bool(l.get('attended_at')) for l in leads),'feedback':sum(bool(l.get('feedback')) for l in leads),'reasons':reasons,'purchases':sum(l.get('feedback',{}).get('outcome')=='purchased' for l in leads)}
        if user['role']=='admin':
            entries=[json.loads(r[0]) for r in c.execute('SELECT data FROM pilot_enrollments')];radius=config(c)['radius']
            result['enrollments']={'total':len(entries),'inside':sum(x['distance']<=radius for x in entries),'sources':{key:sum(x['source']==key for x in entries) for key in ['meta','google','friend','dealer','other']}}
        api.reply(200,result);return True
    match=re.fullmatch(r'/api/pilot/leads/([a-f0-9]+)/([a-z]+)',path)
    if match and method in ['PUT','POST']:
        lid,action=match.groups();lead=c.execute('SELECT l.*,d.appointment,d.attendance_code,d.attended_at FROM leads l JOIN lead_details d ON d.lead_id=l.id WHERE l.id=?',(lid,)).fetchone()
        if not lead:raise Problem(404,'Demande introuvable')
        if action=='feedback' and method=='PUT':
            if lead['user_id']!=uid:raise Problem(403,'Seul l’acheteur peut rédiger son bilan')
            if not lead['attended_at'] and (not lead['appointment'] or lead['appointment']>time.time()):raise Problem(400,'Le bilan sera disponible après le créneau d’essai')
            outcome=data.get('outcome');reason=data.get('reason')
            if outcome not in OUTCOMES or reason not in REASONS:raise Problem(400,'Bilan invalide')
            clean={'outcome':outcome,'reason':reason,'liked':textfield(data,'liked',0,1000),'next':textfield(data,'next',0,1000),'shared':data.get('shared') is True,'updated':time.time()}
            c.execute('UPDATE lead_details SET feedback=? WHERE lead_id=?',(json.dumps(clean),lid));c.commit();api.reply(200,clean);return True
        if action=='attendance' and method=='POST':
            api.role(user,'dealer','admin')
            if user['role']=='dealer' and user['dealer_id']!=lead['dealer_id']:raise Problem(403,'Accès réservé')
            api.limited(c,'attendance:'+uid+':'+lid,5)
            now=time.time()
            if not lead['appointment'] or not lead['appointment']-7200<=now<=lead['appointment']+172800:raise Problem(400,'Confirmation ouverte de 2 h avant à 48 h après le créneau')
            code=textfield(data,'code',6,6)
            if not lead['attendance_code'] or not secrets.compare_digest(code,lead['attendance_code']):raise Problem(400,'Code incorrect')
            if lead['attended_at']:api.reply(200,{'ok':True});return True
            c.execute('UPDATE lead_details SET attended_at=? WHERE lead_id=?',(now,lid));c.execute("UPDATE leads SET status='Terminé',updated=? WHERE id=?",(now,lid))
            c.execute('INSERT INTO lead_events(lead_id,actor,status,created,detail) VALUES (?,?,?,?,?)',(lid,uid,'Terminé',now,json.dumps({'attendance':'Code présenté par l’acheteur'})));c.commit();api.reply(200,{'ok':True});return True
    raise Problem(404,'Route pilote introuvable')
