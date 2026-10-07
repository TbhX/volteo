import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz,updated_at timestamptz,aal text);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}')$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated,service_role;
 grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
 for(const file of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec('set extra_float_digits=0');
 const results=await db.exec(fs.readFileSync('tests/cloud-security.sql','utf8'));console.log(JSON.stringify(results.filter(r=>r.rows.length).map(r=>r.rows)));
 await db.exec(`begin;set local role service_role;select public.volteo_geo_cache('00000','[{"code":"00000","name":"Test","lat":0,"lon":0}]');rollback;`);
 console.log('Service-only commune cache: passed');
}catch(error){console.error(error.message,error.where||'');process.exitCode=1;}finally{await db.close();}
