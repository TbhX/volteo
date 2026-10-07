"""Public geographic sources. No API key, no database write of location."""
import json, math, threading, time, urllib.parse, urllib.request
from datetime import datetime, timezone
FUEL_SOURCE='https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/'
FUEL_API='https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records'
OSM_SOURCE='https://www.openstreetmap.org/copyright'
_cache={};_lock=threading.Lock()
class SourceError(Exception): pass

def fetch(url,body=None,timeout=22):
    req=urllib.request.Request(url,data=body,headers={'User-Agent':'VOLTEO/4.1 geographic research (OpenStreetMap and French open data)','Accept':'application/json','Content-Type':'application/x-www-form-urlencoded' if body else 'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as response:
            raw=response.read(5_000_001)
            if len(raw)>5_000_000: raise SourceError('Réponse géographique trop volumineuse')
            return json.loads(raw)
    except Exception as e: raise SourceError('Source temporairement indisponible. Réessayez dans quelques instants.') from e

def cached(key,ttl,loader):
    now=time.time()
    with _lock:
        for old in list(_cache):
            if _cache[old][0]<now: del _cache[old]
        if key in _cache:return _cache[key][1]
    result=loader()
    with _lock:
        if len(_cache)>200:_cache.clear()
        _cache[key]=(now+ttl,result)
    return result

def distance(lat,lon,other_lat,other_lon):
    a,b=map(math.radians,[lat,other_lat]);dlat=b-a;dlon=math.radians(other_lon-lon)
    h=math.sin(dlat/2)**2+math.cos(a)*math.cos(b)*math.sin(dlon/2)**2
    return round(6371*2*math.asin(min(1,math.sqrt(h))),2)

def postal(code):
    url='https://geo.api.gouv.fr/communes?'+urllib.parse.urlencode({'codePostal':code,'fields':'nom,code,codesPostaux,centre','format':'json','geometry':'centre'})
    result=fetch(url)
    return [{'name':r['nom'],'code':r['code'],'lat':r['centre']['coordinates'][1],'lon':r['centre']['coordinates'][0]} for r in result if r.get('centre',{}).get('coordinates')]

def normalize_fuel(row,lat,lon):
    coords=row.get('geom') or {}
    if not isinstance(coords,dict) or 'lat' not in coords or 'lon' not in coords:return None
    prices={}
    available=row.get('carburants_disponibles')
    for label,key in [('Gazole','gazole'),('SP95','sp95'),('E10','e10'),('SP98','sp98'),('E85','e85'),('GPLc','gplc')]:
        value=row.get(key+'_prix');updated=row.get(key+'_maj')
        if not isinstance(value,(int,float)) or not 0<value<10 or not updated:continue
        if row.get(key+'_rupture_type') or isinstance(available,list) and label not in available:continue
        try:stale=(datetime.now(timezone.utc)-datetime.fromisoformat(updated.replace('Z','+00:00'))).days>7
        except (TypeError,ValueError):stale=True
        prices[label]={'value':value,'updated':updated,'stale':stale}
    return {'id':'fuel-'+str(row['id']),'kind':'fuel','name':'Station · '+str(row.get('ville') or row.get('cp') or ''),'address':row.get('adresse') or '', 'city':row.get('ville') or '', 'lat':coords['lat'],'lon':coords['lon'],'distance':distance(lat,lon,coords['lat'],coords['lon']),'prices':prices,'source':FUEL_SOURCE,'electricCharging':'Bornes électriques' in (row.get('services_service') or [])}

def stations(lat,lon,radius):
    def load():
        geom=f"geom'POINT({lon} {lat})'"
        params={'where':f'within_distance(geom, {geom}, {radius}km)','order_by':f'distance(geom, {geom})','limit':100}
        result=fetch(FUEL_API+'?'+urllib.parse.urlencode(params));items=[]
        for row in result.get('results',[]):
            item=normalize_fuel(row,lat,lon)
            if item and item['distance']<=radius:items.append(item)
        return {'items':sorted(items,key=lambda x:x['distance']),'total':result.get('total_count',len(items)),'source':FUEL_SOURCE,'license':'Licence Ouverte 2.0','retrievedAt':datetime.now(timezone.utc).isoformat()}
    return cached(('fuel',round(lat,3),round(lon,3),radius),300,load)

def safe_url(url):
    if not isinstance(url,str):return None
    if not url.startswith(('https://','http://')):return None
    return url if len(url)<1000 else None

def normalize_dealer(row,lat,lon):
    tags=row.get('tags',{});coords=row.get('center',row)
    if 'lat' not in coords or 'lon' not in coords:return None
    name=tags.get('name') or tags.get('brand') or 'Établissement automobile'
    address=' '.join(str(tags.get(k,'')) for k in ['addr:housenumber','addr:street','addr:postcode','addr:city']).strip()
    return {'id':'osm-'+row['type']+'-'+str(row['id']),'kind':'dealer','name':name,'address':address,'city':tags.get('addr:city',''),'brands':tags.get('brand',''),'lat':coords['lat'],'lon':coords['lon'],'distance':distance(lat,lon,coords['lat'],coords['lon']),'website':safe_url(tags.get('website') or tags.get('contact:website')),'source':'https://www.openstreetmap.org/'+row['type']+'/'+str(row['id']),'electricConfirmed':False}

def dealers(lat,lon,radius):
    def load():
        query=f'[out:json][timeout:18];nwr["shop"="car"](around:{int(radius*1000)},{lat},{lon});out center tags;'
        result=fetch('https://overpass-api.de/api/interpreter?'+urllib.parse.urlencode({'data':query}),timeout=23)
        if result.get('remark') and not result.get('elements'):raise SourceError('La recherche OpenStreetMap a expiré. Essayez un rayon plus petit.')
        items=[normalize_dealer(row,lat,lon) for row in result.get('elements',[])];items=[x for x in items if x and x['distance']<=radius]
        items.sort(key=lambda x:x['distance'])
        return {'items':items[:100],'total':len(items),'source':OSM_SOURCE,'license':'ODbL','retrievedAt':datetime.now(timezone.utc).isoformat(),'note':'Établissements recensés par OpenStreetMap. Marques, stock électrique et créneaux à confirmer auprès du professionnel.'}
    return cached(('dealer',round(lat,3),round(lon,3),radius),1800,load)


def normalize_charging(row,lat,lon):
    tags=row.get('tags',{});coords=row.get('center',row)
    if 'lat' not in coords or 'lon' not in coords or tags.get('access') in ['private','no'] or tags.get('motorcar')=='no':return None
    sockets=[]
    for key,label in [('type2','Type 2'),('type2_cable','Type 2 avec câble'),('type2_combo','CCS'),('chademo','CHAdeMO')]:
        count=tags.get('socket:'+key)
        if count and count not in ['0','no']:
            sockets.append({'type':label,'count':str(count),'power':tags.get('socket:'+key+':output','Non renseignée')})
    return {'id':'osm-'+row['type']+'-'+str(row['id']),'kind':'charging','name':tags.get('name') or tags.get('operator') or 'Station de recharge','address':' '.join(tags.get(k,'') for k in ['addr:housenumber','addr:street','addr:postcode','addr:city']).strip(),'lat':coords['lat'],'lon':coords['lon'],'distance':distance(lat,lon,coords['lat'],coords['lon']),'sockets':sockets,'hours':tags.get('opening_hours','Non renseignés'),'access':tags.get('access','Non renseigné'),'operator':tags.get('operator',''),'source':'https://www.openstreetmap.org/'+row['type']+'/'+str(row['id']),'live':False}

def charging(lat,lon,radius):
    def load():
        query=f'[out:json][timeout:18];nwr["amenity"="charging_station"](around:{int(radius*1000)},{lat},{lon});out center tags;'
        result=fetch('https://overpass-api.de/api/interpreter?'+urllib.parse.urlencode({'data':query}),timeout=23)
        if result.get('remark'):raise SourceError('Recherche de bornes incomplète. Réessayez avec un rayon plus petit.')
        items=[normalize_charging(row,lat,lon) for row in result.get('elements',[])];items=sorted([x for x in items if x and x['distance']<=radius],key=lambda x:x['distance'])
        return {'items':items[:100],'total':len(items),'source':OSM_SOURCE,'retrievedAt':datetime.now(timezone.utc).isoformat(),'license':'ODbL','live':False}
    return cached(('charging',round(lat,3),round(lon,3),radius),1800,load)
