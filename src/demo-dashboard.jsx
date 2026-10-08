// Development-only entry. Not imported by index.html or any production module.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation,Link} from 'react-router-dom';
import Dashboard from './Dashboard';
import vehicles from '../server/vehicles.json';
import './style.css';
import './experience.css';
const now=Date.now()/1000;
const dealers=[{id:1,name:'Concession Démo Les Ulis'},{id:2,name:'Concession Démo Essonne'}];
const leads=Array.from({length:45},(_,i)=>({id:'demo-'+i,name:'Contact fictif '+(i+1),vehicle_slug:vehicles[i%vehicles.length].slug,dealer_id:i%2+1,status:['Nouveau','Contacté','Essai planifié','Terminé','Fermé'][i%5],created:now-(i%36)*86400,updated:now-(i%12)*86400,appointment:i%5===2?now+(i%6-1)*86400:null,attended_at:i%5===3?now-3600:null,trial:{mode:i%8===0?'demo':'partner'}}));
const offers=[{id:'demo-offer',dealer_id:1,status:'published',valid_until:now-1000},{id:'demo-offer2',dealer_id:2,status:'published',valid_until:now+86400}];
const users=[{id:'pending-demo',name:'Contact professionnel fictif',company:'Partenaire Démo',account_type:'pro',role:'user',postcode:'91940'}];
function Demo(){const [signed,setSigned]=useState(false),[id,setId]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[role,setRole]=useState('admin');
 if(!import.meta.env.DEV)return <p>Cette démonstration est disponible uniquement avec le serveur de développement.</p>;
 if(!signed)return <main className="container demo-login"><h1>VOLTÉO · Démo locale</h1><p>Tableaux de bord fictifs, isolés de vos comptes et de votre base.</p><form className="panel" onSubmit={e=>{e.preventDefault();if(id==='admin'&&password==='admin'){setSigned(true);setPassword('');setError('');}else setError('Identifiants de démonstration incorrects.');}}><label>Identifiant<input value={id} onChange={e=>setId(e.target.value)} autoComplete="off" required/></label><label>Mot de passe<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off" required/></label><button>Ouvrir la démonstration</button><p role="alert">{error}</p></form></main>;
 const source=async path=>path==='/leads'?(role==='admin'?leads:leads.filter(l=>l.dealer_id===1)):path==='/pilot/inventory'?(role==='admin'?offers:offers.filter(o=>o.dealer_id===1)):path==='/admin/users'?users:[];
 return <div className="demo-shell"><div className="demo-bar"><strong>DONNÉES FICTIVES · LOCAL UNIQUEMENT</strong><label>Vue <select value={role} onChange={e=>setRole(e.target.value)}><option value="admin">Administrateur</option><option value="dealer">Professionnel</option></select></label><button className="secondary" onClick={()=>setSigned(false)}>Se déconnecter</button></div><div className="demo-scroll"><MemoryRouter><DemoDashboard role={role} source={source}/></MemoryRouter></div></div>;
}
function DemoDashboard({role,source}){const loc=useLocation();return <>{loc.pathname!=='/'&&<div className="notice">Cette action ouvre un outil réel dans l’application. Ici, seule la consultation des tableaux de bord est simulée. <Link to="/">Retour au tableau de bord</Link></div>}<Dashboard key={role} source={source} demo app={{user:{id:'demo-'+role,role,company:'Concession Démo Les Ulis'},vehicles,dealers}}/></>;}
createRoot(document.getElementById('root')).render(<Demo/>);
