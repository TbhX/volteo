create or replace function volteo_private.dispatch(p text,m text,d jsonb,u volteo_private.users) returns jsonb language plpgsql set search_path='' as $$
#variable_conflict use_column
<<ctx>>
declare r jsonb;v jsonb;b jsonb;clean jsonb;old jsonb;tr jsonb;cfg jsonb;item jsonb;items jsonb;statuses jsonb;reasons jsonb;
 uid uuid:=u.id;stamp float8:=round(extract(epoch from clock_timestamp()),3);did bigint;lid text;slug text;k text;s text;oid text;apt float8;prev float8;changed integer;dist float8;days numeric;
 l volteo_private.leads;detail volteo_private.lead_details;o volteo_private.pilot_offers;pa volteo_private.pilot_partners;
begin
 if m='GET' then
  if p='/vehicles' then return (select coalesce(jsonb_agg(data order by slug),'[]') from volteo_private.vehicles);end if;
  if p='/dealers' then return (select coalesce(jsonb_agg(data order by id),'[]') from volteo_private.dealers);end if;
  if p='/articles' then return (select coalesce(jsonb_agg(data order by slug),'[]') from volteo_private.articles);end if;
  if p='/pilot' then return volteo_private.config();end if;
  if p='/pilot/offers' then return (select coalesce(jsonb_agg(x order by updated desc),'[]') from (select volteo_private.offer(id) x,updated from volteo_private.pilot_offers) q where x is not null);end if;
  if p='/session' then return jsonb_build_object('user',case when uid is null then null else to_jsonb(u)-'created' end,'csrf',null);end if;
 end if;
 if uid is null then perform volteo_private.fail('Connectez-vous pour continuer','PT401');end if;
 if m in ('POST','PUT') and p in ('/profile','/project','/leads','/pilot/enrollment') and (u.account_type='pro' or u.role<>'user') then perform volteo_private.fail('Cette action appartient au parcours acheteur','PT403');end if;
 if p='/me' and m='GET' then return jsonb_build_object('project',(select data from volteo_private.buyer_projects where user_id=uid),'profile',(select data from volteo_private.profiles where user_id=uid),'favorites',(select coalesce(jsonb_agg(vehicle_slug),'[]') from volteo_private.favorites where user_id=uid),'simulations',(select coalesce(jsonb_agg(to_jsonb(t) order by created desc),'[]') from volteo_private.simulations t where user_id=uid),'leads',volteo_private.leads_view(u));end if;
 if p='/project' then
  if m='GET' then select jsonb_build_object('project',data,'updated',updated) into r from volteo_private.buyer_projects where user_id=uid;return coalesce(r,'{"project":null,"updated":null}');end if;
  if m='DELETE' then delete from volteo_private.buyer_projects where user_id=uid;return '{"ok":true}';end if;
  if m='PUT' then
   clean=volteo_private.project(d);insert into volteo_private.buyer_projects values(uid,clean,stamp) on conflict(user_id) do update set data=excluded.data,updated=excluded.updated;
   insert into volteo_private.profiles values(uid,volteo_private.project(clean,false)) on conflict(user_id) do update set data=excluded.data;
   update volteo_private.users set postcode=clean->>'postcode' where id=uid;return jsonb_build_object('project',clean,'updated',stamp);
  end if;
 end if;
 if p='/profile' and m='PUT' then
  clean=volteo_private.project(d,false);insert into volteo_private.profiles values(uid,clean) on conflict(user_id) do update set data=excluded.data;
  update volteo_private.buyer_projects set data=data||clean,updated=stamp where user_id=uid;return clean;
 end if;
 if p like '/favorites/%' and m in ('PUT','DELETE') then
  slug=substr(p,12);if not exists(select 1 from volteo_private.vehicles where vehicles.slug=ctx.slug) then perform volteo_private.fail('Véhicule introuvable','PT404');end if;
  if m='PUT' then insert into volteo_private.favorites values(uid,slug) on conflict do nothing;else delete from volteo_private.favorites where user_id=uid and vehicle_slug=slug;end if;return '{"ok":true}';
 end if;
 if p='/simulations' and m='POST' then
  clean='{}';for k,b in select * from jsonb_each('{"km":[0,200000,15000],"years":[1,15,5],"fuel":[0,10,1.85],"liters":[0,40,6],"homeRate":[0,10,0.25],"publicRate":[0,10,0.6],"homeShare":[0,100,80],"electricMaintenance":[0,10000,350],"thermalMaintenance":[0,10000,700],"electricInsurance":[0,10000,700],"thermalInsurance":[0,10000,650],"thermalValue":[0,500000,15000],"thermalResale":[0,500000,6000],"electricResale":[0,500000,18000],"deposit":[0,500000,5000],"months":[1,120,60],"apr":[0,30,4],"installation":[0,20000,1200]}'::jsonb) loop clean=clean||jsonb_build_object(k,volteo_private.num(d,k,(b->>0)::numeric,(b->>1)::numeric,(b->>2)::numeric));end loop;
  slug=volteo_private.txt(d,'vehicle',1,100);select data into v from volteo_private.vehicles where vehicles.slug=ctx.slug;if v is null then perform volteo_private.fail('Véhicule invalide');end if;
  if (clean->>'deposit')::numeric>(v->>'priceMin')::numeric or (clean->>'electricResale')::numeric>(v->>'priceMin')::numeric or (clean->>'thermalResale')::numeric>(clean->>'thermalValue')::numeric then perform volteo_private.fail('Apport ou valeur de revente incohérente');end if;
  clean=clean||jsonb_build_object('vehicle',slug,'fuelSource',volteo_private.txt(d,'fuelSource',0,500));oid=replace(gen_random_uuid()::text,'-','');insert into volteo_private.simulations values(oid,uid,clean,stamp);return jsonb_build_object('id',oid);
 end if;
 if p='/leads' and m='GET' then return volteo_private.leads_view(u);end if;
 if p='/leads' and m='POST' then
  slug=volteo_private.txt(d,'vehicle',1,100);did=volteo_private.num(d,'dealer_id',1,2147483647,0);if d->>'dealer_id' !~ '^\d+$' then perform volteo_private.fail('Concession invalide');end if;
  select data into v from volteo_private.vehicles where vehicles.slug=ctx.slug;select data into b from volteo_private.dealers where id=did;
  if v is null or b is null or b->'essai' is distinct from 'true'::jsonb or not(b->'brands' ? (v->>'brand')) then perform volteo_private.fail('Cette concession ne propose pas ce véhicule en essai');end if;
  if d->'consent' is distinct from 'true'::jsonb then perform volteo_private.fail('Autorisez la transmission à la concession choisie');end if;
  s=volteo_private.txt(d,'phone',8,25);if s !~ '^[+0-9 ().-]{8,25}$' then perform volteo_private.fail('Téléphone invalide');end if;
  tr=coalesce(d->'trial','{}');if jsonb_typeof(tr)<>'object' then perform volteo_private.fail('Préparation d’essai invalide');end if;
  tr=jsonb_build_object('priorities',volteo_private.priorities(tr,'priorities'),'route',volteo_private.txt(tr,'route',0,600),'mode','demo');
  oid=volteo_private.txt(d,'offer_id',0,60);
  if oid<>'' then
   item=volteo_private.offer(oid);if item is null or (item->>'dealer_id')::bigint<>did or item->>'vehicle_slug'<>slug then perform volteo_private.fail('Cette offre n’est plus disponible. Actualisez les offres locales.','PT409');end if;
   tr=tr||jsonb_build_object('mode','partner','offer',(select jsonb_object_agg(key,value) from jsonb_each(item) where key=any(array['id','trim','cash_price','fees','availability','valid_until','updated','terms'])));
  elsif b->'pilot'='true' then perform volteo_private.fail('Choisissez une offre locale active de ce partenaire');end if;
  clean=null;if d->'share_project'='true' then select data into clean from volteo_private.buyer_projects where user_id=uid;if clean is null then perform volteo_private.fail('Enregistrez votre dossier avant de le partager');end if;end if;
  lid=replace(gen_random_uuid()::text,'-','');insert into volteo_private.leads values(lid,uid,slug,did,volteo_private.txt(d,'message',0,2000),s,'Nouveau',stamp,stamp);
  insert into volteo_private.lead_details(lead_id,project,consent_version,consent_at,trial,attendance_code) values(lid,clean,case when clean is null then 'trial-v2-contact' else 'trial-v2-project' end,stamp,tr,lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6));
  insert into volteo_private.lead_events(lead_id,actor,status,created) values(lid,uid,'Nouveau',stamp);return jsonb_build_object('id',lid);
 end if;
 if p ~ '^/leads/[a-f0-9]+$' and m in ('GET','PATCH','DELETE') then
  lid=split_part(p,'/',3);select * into l from volteo_private.leads where id=lid for update;
  if not found then perform volteo_private.fail('Demande introuvable','PT404');end if;
  if not(u.role='admin' or u.role='dealer' and u.dealer_id=l.dealer_id or m in ('GET','DELETE') and l.user_id=uid) then perform volteo_private.fail('Accès réservé','PT403');end if;
  if m='GET' then return(select coalesce(jsonb_agg(jsonb_build_object('status',status,'created',created,'detail',lead_events.detail) order by id),'[]') from volteo_private.lead_events where lead_id=lid);end if;
  if m='DELETE' then delete from volteo_private.leads where id=lid;return '{"ok":true}';end if;
  stamp=greatest(stamp,round((l.updated+0.001)::numeric,3)::float8);if (d->>'expected_updated')::float8 is distinct from l.updated then perform volteo_private.fail('Cette demande a été modifiée. Rechargez la liste.','PT409');end if;
  s=volteo_private.choice(d,'status',array['Nouveau','Contacté','Essai planifié','Terminé','Fermé']);select * into detail from volteo_private.lead_details where lead_id=lid;
  apt=detail.appointment;if s='Essai planifié' then apt=volteo_private.num(d,'appointment',(stamp+1)::numeric,(stamp+366*86400)::numeric,0);if apt=0 then perform volteo_private.fail('Choisissez un créneau futur');end if;end if;
  if detail.attended_at is not null and (s<>'Terminé' or apt is distinct from detail.appointment) then perform volteo_private.fail('Un essai confirmé ne peut plus être replanifié ou fermé');end if;
  update volteo_private.leads set status=s,updated=stamp where id=lid;
  update volteo_private.lead_details set appointment=apt,reply=volteo_private.txt(d,'reply',0,1000),attendance_code=case when apt is distinct from detail.appointment then lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6) else attendance_code end where lead_id=lid;
  insert into volteo_private.lead_events(lead_id,actor,status,created,detail) values(lid,uid,s,stamp,jsonb_build_object('appointment',apt,'reply',volteo_private.txt(d,'reply',0,1000))::text);return '{"ok":true}';
 end if;
 if p='/export' and m='GET' then
  return jsonb_build_object('user',to_jsonb(u)-'created','profile',(select coalesce(jsonb_agg(data),'[]') from volteo_private.profiles where user_id=uid),'project',(select coalesce(jsonb_agg(jsonb_build_object('data',data,'updated',updated)),'[]') from volteo_private.buyer_projects where user_id=uid),'favorites',(select coalesce(jsonb_agg(vehicle_slug),'[]') from volteo_private.favorites where user_id=uid),'simulations',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from volteo_private.simulations t where user_id=uid),'leads',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from volteo_private.leads t where user_id=uid),'lead_details',(select coalesce(jsonb_agg(to_jsonb(t)-'attendance_code'),'[]') from volteo_private.lead_details t join volteo_private.leads l on l.id=t.lead_id where l.user_id=uid),'pilot_enrollment',(select coalesce(jsonb_agg(data),'[]') from volteo_private.pilot_enrollments where user_id=uid));
 end if;
 if p='/admin/users' and m='GET' then
  if u.role<>'admin' then perform volteo_private.fail('Accès réservé','PT403');end if;return(select coalesce(jsonb_agg(to_jsonb(t)-'created'),'[]') from volteo_private.users t);
 end if;
 if p like '/admin/users/%' and m='PATCH' then
  if u.role<>'admin' then perform volteo_private.fail('Accès réservé','PT403');end if;
  k=split_part(p,'/',4);if k=uid::text then perform volteo_private.fail('Votre propre rôle ne peut pas être modifié ici');end if;
  s=volteo_private.choice(d,'role',array['user','dealer','admin']);did=null;
  if s='dealer' then did=volteo_private.num(d,'dealer_id',1,2147483647,0);if not exists(select 1 from volteo_private.dealers where id=did) then perform volteo_private.fail('Concession requise');end if;end if;
  update volteo_private.users set role=s,dealer_id=did where id=k::uuid;if not found then perform volteo_private.fail('Compte introuvable','PT404');end if;
  -- Every request reads the current database role; no stale role claims.
  return '{"ok":true}';
 end if;
 if p like '/admin/vehicles/%' and m='PUT' then
  if u.role<>'admin' then perform volteo_private.fail('Accès réservé','PT403');end if;slug=split_part(p,'/',4);select data into v from volteo_private.vehicles where vehicles.slug=ctx.slug;
  if v is null then perform volteo_private.fail('Véhicule introuvable','PT404');end if;
  for k,b in select * from jsonb_each('{"priceMin":[0,1000000,0],"priceMax":[0,1000000,0],"autonomy":[1,2000,1],"conso":[1,100,1],"fastKW":[0,1000,0]}'::jsonb) loop v=v||jsonb_build_object(k,volteo_private.num(d,k,(b->>0)::numeric,(b->>1)::numeric,(b->>2)::numeric));end loop;
  if (v->>'priceMax')::numeric<(v->>'priceMin')::numeric then perform volteo_private.fail('Fourchette de prix invalide');end if;
  v=v||jsonb_build_object('source',volteo_private.txt(d,'source',0,500),'updatedAt',current_date::text,'dataStatus','Démonstration — non vérifié');update volteo_private.vehicles set data=v where vehicles.slug=ctx.slug;return v;
 end if;
 if p='/pilot/settings' and m='PUT' then
  if u.role<>'admin' then perform volteo_private.fail('Accès réservé','PT403');end if;
  if coalesce(d->>'radius','') not in ('10','15','20','25','30','50') then perform volteo_private.fail('Rayon invalide');end if;
  insert into volteo_private.pilot_settings values(1,(d->>'radius')::int,stamp) on conflict(id) do update set radius=excluded.radius,updated=excluded.updated;return volteo_private.config();
 end if;
 if p='/pilot/enrollment' then
  if u.account_type='pro' or u.role<>'user' then perform volteo_private.fail('Inscription réservée aux acheteurs','PT403');end if;
  if m='GET' then return(select data||jsonb_build_object('updated',updated) from volteo_private.pilot_enrollments where user_id=uid);end if;
  if m='DELETE' then delete from volteo_private.pilot_enrollments where user_id=uid;return '{"ok":true}';end if;
  if m='PUT' then
   if d->'consent' is distinct from 'true'::jsonb then perform volteo_private.fail('Confirmez votre participation au pilote');end if;
   select data into v from volteo_private.communes where postcode=volteo_private.txt(d,'postcode',5,5) and code=volteo_private.txt(d,'city_code',5,5) and updated>now()-interval '7 days';
   if v is null then perform volteo_private.fail('Vérifiez votre commune avant de participer');end if;
   cfg=volteo_private.config();dist=volteo_private.distance((v->>'lat')::float8,(v->>'lon')::float8);
   clean=jsonb_build_object('city',v->>'name','city_code',d->>'city_code','postcode',d->>'postcode','distance',dist,'status',case when dist<=(cfg->>'radius')::int then 'pilot' else 'outside' end,'source',volteo_private.choice(d,'source',array['meta','google','friend','dealer','other'],'other'),'consent_at',stamp,'consent_version','pilot-interest-v1','radius_at_signup',cfg->'radius');
   insert into volteo_private.pilot_enrollments values(uid,clean,stamp,stamp) on conflict(user_id) do update set data=excluded.data,updated=excluded.updated;return clean;
  end if;
 end if;
 if p='/pilot/partners' and m in ('GET','PUT') then
  if u.role<>'admin' then perform volteo_private.fail('Accès réservé','PT403');end if;
  if m='GET' then return(select coalesce(jsonb_agg(data||jsonb_build_object('dealer_id',dealer_id,'updated',updated)),'[]') from volteo_private.pilot_partners);end if;
  did=(d->>'dealer_id')::bigint;if did is not null then select * into pa from volteo_private.pilot_partners where dealer_id=did for update;if pa.dealer_id is not null then stamp=greatest(stamp,round((pa.updated+0.001)::numeric,3)::float8);end if;if pa.dealer_id is not null and (d->>'expected_updated')::float8 is distinct from pa.updated then perform volteo_private.fail('Établissement modifié. Rechargez.','PT409');end if;end if;
  s=volteo_private.choice(d,'status',array['pending','verified','suspended']);if s='verified' and d->'verification_ack' is distinct from 'true'::jsonb then perform volteo_private.fail('Confirmez la vérification du partenariat');end if;
  clean=jsonb_build_object('name',volteo_private.txt(d,'name',2,120),'city',volteo_private.txt(d,'city',2,120),'address',volteo_private.txt(d,'address',5,300),'evidence',volteo_private.txt(d,'evidence',10,1000),'lat',volteo_private.num(d,'lat',-90,90,48.6817),'lon',volteo_private.num(d,'lon',-180,180,2.1864),'status',s,'verified_at',case when s='verified' then stamp else null end);
  b=coalesce(d->'brands','[]');if jsonb_typeof(b)<>'array' then perform volteo_private.fail('Marques invalides');end if;
  if jsonb_array_length(b)=0 or exists(select 1 from jsonb_array_elements_text(b) t(x) where not exists(select 1 from volteo_private.vehicles where data->>'brand'=x)) then perform volteo_private.fail('Choisissez les marques représentées');end if;clean=clean||jsonb_build_object('brands',b);
  if did is null then insert into volteo_private.dealers(data) values('{}') returning id into did;elsif not exists(select 1 from volteo_private.dealers where id=did) then perform volteo_private.fail('Établissement introuvable');end if;
  v=clean-'evidence'-'status'-'verified_at'||jsonb_build_object('id',did,'essai',s='verified','partenaire',s='verified','pilot',true,'dataStatus',case when s='verified' then 'Partenaire validé manuellement' else 'Partenaire non actif' end);
  update volteo_private.dealers set data=v where id=did;
  insert into volteo_private.pilot_partners values(did,clean,stamp) on conflict(dealer_id) do update set data=excluded.data,updated=excluded.updated;return clean||jsonb_build_object('dealer_id',did,'updated',stamp);
 end if;
 if p='/pilot/inventory' or p like '/pilot/inventory/%' then
  if u.role not in ('dealer','admin') then perform volteo_private.fail('Accès réservé','PT403');end if;
  if p='/pilot/inventory' and m='GET' then return(select coalesce(jsonb_agg(volteo_private.offer(id,true) order by updated desc),'[]') from volteo_private.pilot_offers where u.role='admin' or dealer_id=u.dealer_id);end if;
  if m in ('POST','PUT') then
   if m='PUT' then oid=split_part(p,'/',4);select * into o from volteo_private.pilot_offers where id=oid for update;if not found then perform volteo_private.fail('Offre introuvable','PT404');end if;did=o.dealer_id;if u.role='dealer' and did is distinct from u.dealer_id then perform volteo_private.fail('Accès réservé','PT403');end if;stamp=greatest(stamp,round((o.updated+0.001)::numeric,3)::float8);if (d->>'expected_updated')::float8 is distinct from o.updated then perform volteo_private.fail('Offre modifiée. Rechargez.','PT409');end if;
   else oid=replace(gen_random_uuid()::text,'-','');did=case when u.role='dealer' then u.dealer_id else (d->>'dealer_id')::bigint end;end if;
   if u.role='dealer' and did is distinct from u.dealer_id then perform volteo_private.fail('Accès réservé','PT403');end if;
   if not volteo_private.active_partner(did) then perform volteo_private.fail('Un partenaire validé dans le rayon du pilote est requis');end if;
   slug=volteo_private.txt(d,'vehicle_slug',1,100);select data into v from volteo_private.vehicles where vehicles.slug=ctx.slug;select data into b from volteo_private.pilot_partners where dealer_id=did;
   if v is null or not(b->'brands' ? (v->>'brand')) then perform volteo_private.fail('Véhicule incompatible avec l’établissement');end if;
   if d->'stock_ack' is distinct from 'true'::jsonb then perform volteo_private.fail('Confirmez prix, frais et disponibilité');end if;
   days=volteo_private.num(d,'valid_days',1,7,7);clean=jsonb_build_object('trim',volteo_private.txt(d,'trim',3,200),'availability',volteo_private.txt(d,'availability',3,300),'terms',volteo_private.txt(d,'terms',3,1000),'source',volteo_private.txt(d,'source',5,500),'cash_price',volteo_private.num(d,'cash_price',1000,1000000,0),'fees',volteo_private.num(d,'fees',0,100000,0),'status',volteo_private.choice(d,'status',array['published','withdrawn'],'published'),'valid_until',stamp+days*86400);
   if (clean->>'cash_price')::numeric<1000 then perform volteo_private.fail('Prix requis');end if;
   insert into volteo_private.pilot_offers values(oid,did,slug,clean,stamp) on conflict(id) do update set vehicle_slug=excluded.vehicle_slug,data=excluded.data,updated=excluded.updated;return volteo_private.offer(oid,true);
  end if;
 end if;
 if p='/pilot/dashboard' and m='GET' then
  if u.role not in ('dealer','admin') then perform volteo_private.fail('Accès réservé','PT403');end if;
  items=volteo_private.leads_view(u);select coalesce(jsonb_agg(x),'[]') into r from jsonb_array_elements(items) x where x->'trial'->>'mode'='partner';
  statuses='{}';foreach s in array array['Nouveau','Contacté','Essai planifié','Terminé','Fermé'] loop statuses=statuses||jsonb_build_object(s,(select count(*) from jsonb_array_elements(r) x where x->>'status'=s));end loop;
  reasons='{}';foreach s in array array['budget','charging','range','comfort','availability','timing','other'] loop reasons=reasons||jsonb_build_object(s,(select count(*) from jsonb_array_elements(r) x where x->'feedback'->>'reason'=s));end loop;
  v=jsonb_build_object('demo_count',jsonb_array_length(items)-jsonb_array_length(r),'total',jsonb_array_length(r),'statuses',statuses,'reasons',reasons,'attended',(select count(*) from jsonb_array_elements(r) x where x->>'attended_at' is not null),'feedback',(select count(*) from jsonb_array_elements(r) x where x->'feedback'<>'{}'::jsonb),'purchases',(select count(*) from jsonb_array_elements(r) x where x->'feedback'->>'outcome'='purchased'));
  if u.role='admin' then clean='{}';foreach s in array array['meta','google','friend','dealer','other'] loop clean=clean||jsonb_build_object(s,(select count(*) from volteo_private.pilot_enrollments where data->>'source'=s));end loop;
   v=v||jsonb_build_object('enrollments',jsonb_build_object('total',(select count(*) from volteo_private.pilot_enrollments),'inside',(select count(*) from volteo_private.pilot_enrollments where (data->>'distance')::float8<=(volteo_private.config()->>'radius')::int),'sources',clean));end if;return v;
 end if;
 if p ~ '^/pilot/leads/[a-f0-9]+/(feedback|attendance)$' then
  lid=split_part(p,'/',4);k=split_part(p,'/',5);select * into l from volteo_private.leads where id=lid for update;if not found then perform volteo_private.fail('Demande introuvable','PT404');end if;select * into detail from volteo_private.lead_details where lead_id=lid;
  if k='feedback' and m='PUT' then
   if l.user_id<>uid then perform volteo_private.fail('Seul l’acheteur peut rédiger son bilan','PT403');end if;
   if detail.attended_at is null and (detail.appointment is null or detail.appointment>stamp) then perform volteo_private.fail('Le bilan sera disponible après le créneau');end if;
   clean=jsonb_build_object('outcome',volteo_private.choice(d,'outcome',array['pursue','compare','pause','purchased']),'reason',volteo_private.choice(d,'reason',array['none','budget','charging','range','comfort','availability','timing','other']),'liked',volteo_private.txt(d,'liked',0,1000),'next',volteo_private.txt(d,'next',0,1000),'shared',coalesce(d->'shared'='true',false),'updated',stamp);
   update volteo_private.lead_details set feedback=clean where lead_id=lid;return clean;
  end if;
  if k='attendance' and m='POST' then
   if u.role not in ('dealer','admin') or u.role='dealer' and u.dealer_id<>l.dealer_id then perform volteo_private.fail('Accès réservé','PT403');end if;
   if detail.appointment is null or stamp not between detail.appointment-7200 and detail.appointment+172800 then perform volteo_private.fail('Confirmation ouverte de 2 h avant à 48 h après le créneau');end if;
   if volteo_private.txt(d,'code',6,6)<>detail.attendance_code then perform volteo_private.fail('Code incorrect');end if;
   if detail.attended_at is not null then return '{"ok":true}';end if;
   update volteo_private.lead_details set attended_at=stamp where lead_id=lid;update volteo_private.leads set status='Terminé',updated=stamp where id=lid;
   insert into volteo_private.lead_events(lead_id,actor,status,created,detail) values(lid,uid,'Terminé',stamp,'{"attendance":"Code présenté par l’acheteur"}');return '{"ok":true}';
  end if;
 end if;
 perform volteo_private.fail('Route introuvable','PT404');return null;
end$$;



