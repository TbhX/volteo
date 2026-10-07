"""Owner-only local tools. No password or recovery endpoint is exposed over HTTP."""
import argparse
import getpass
import json
import secrets
import sqlite3
import time
from pathlib import Path
import app

p=argparse.ArgumentParser(description='Administration locale VOLTÉO')
g=p.add_mutually_exclusive_group(required=True)
g.add_argument('--create-demo-accounts',action='store_true')
g.add_argument('--backup',metavar='DESTINATION')
g.add_argument('--reset-password',metavar='EMAIL')
a=p.parse_args()
if app.STORAGE=='supabase':raise SystemExit('Ces outils sont réservés aux archives SQLite. Pour la base distante, suivre SUPABASE.md.')
app.initialize()
if a.create_demo_accounts:
    accounts=[('acheteur@demo.example','Acheteur démo','user',None),('concession@demo.example','Concession démo','dealer',1),('admin@demo.example','Administration démo','admin',None)]
    with app.db() as c:
        if any(c.execute('SELECT 1 FROM users WHERE email=?',(email,)).fetchone() for email,*_ in accounts):
            raise SystemExit('Comptes de démonstration déjà présents : aucun compte modifié.')
        created=[]
        for email,name,role,dealer in accounts:
            password=secrets.token_urlsafe(20)
            c.execute('INSERT INTO users(id,email,name,password,role,dealer_id,created) VALUES (?,?,?,?,?,?,?)',(secrets.token_hex(16),email,name,app.password_hash(password),role,dealer,time.time()))
            created.append((email,password))
    print('Identifiants à conserver en privé. Ne pas inclure dans les captures ou supports commerciaux.')
    for email,password in created: print(email+' : '+password)
elif a.backup:
    destination=Path(a.backup).resolve()
    if destination.exists(): raise SystemExit('Destination existante : choisissez un nouveau nom.')
    if destination.is_relative_to((app.ROOT.parent/'dist').resolve()): raise SystemExit('Sauvegarde interdite dans le dossier public.')
    destination.parent.mkdir(parents=True,exist_ok=True)
    # Open exclusively with owner permissions before SQLite writes.
    import os
    fd=os.open(destination,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(fd)
    with app.db() as source,sqlite3.connect(destination) as target:
        source.backup(target)
        if target.execute('PRAGMA integrity_check').fetchone()[0]!='ok': raise SystemExit('Échec du contrôle de sauvegarde.')
    print('Sauvegarde SQLite cohérente créée et contrôlée.')
else:
    password=getpass.getpass('Nouveau mot de passe (12 caractères minimum) : ')
    if password!=getpass.getpass('Confirmation : '): raise SystemExit('Confirmation différente.')
    try: app.passwordfield({'password':password},'password')
    except app.Problem as e: raise SystemExit(e.message)
    with app.db() as c:
        row=c.execute('SELECT id FROM users WHERE email=?',(a.reset_password.lower(),)).fetchone()
        if not row: raise SystemExit('Compte introuvable.')
        c.execute('UPDATE users SET password=? WHERE id=?',(app.password_hash(password),row['id']))
        c.execute('DELETE FROM sessions WHERE user_id=?',(row['id'],))
    print('Mot de passe changé ; toutes les sessions de ce compte sont révoquées.')
