import React from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {publicPages} from './public-content';
import {PublicRoot} from './PublicLanding';
import './style.css';
import './experience.css';
const path=location.pathname.replace(/\/+$/,'')||'/';
const root=document.getElementById('root');
if(publicPages[path]){
 const tree=<PublicRoot path={path}/>;
 if(root.dataset.prerendered==='public')hydrateRoot(root,tree);else createRoot(root).render(tree);
}else{
 const client=createRoot(root);
 client.render(<main className="container" role="status"><p>Votre espace VOLTÉO se prépare…</p></main>);
 import('./App').then(({default:App})=>client.render(<App/>)).catch(()=>client.render(<main className="container"><h1>Le chargement a été interrompu.</h1><button onClick={()=>location.reload()}>Réessayer</button></main>));
}
