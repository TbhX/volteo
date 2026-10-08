import fs from 'node:fs/promises';
import pathModule from 'node:path';
import {createServer,loadEnv} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {publicPages,publicPaths} from '../src/public-content.js';
import {siteOrigin,metadata,structuredData,appPaths} from '../src/seo.js';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const origin=siteOrigin(env.VITE_SITE_URL);
if(env.VITE_SITE_URL&&!origin)throw new Error('VITE_SITE_URL doit être une origine HTTPS sans chemin, identifiants ou paramètres.');
if(env.SEO_REQUIRE_ORIGIN==='true'&&!origin)throw new Error('VITE_SITE_URL est requis pour une version indexable.');
const template=await fs.readFile('dist/index.html','utf8');
const vehicles=JSON.parse(await fs.readFile('server/vehicles.json','utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function html(path,body=''){
 const m=metadata(path,origin,vehicles);let out=template.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'').replace(/<meta name="robots"[^>]*>/,'');
 const graph=structuredData(path,origin);const img=origin?origin+'/media/volteo-film-v3-poster.webp':'';
 const head=`<title>${escape(m.title)}</title><meta name="description" content="${escape(m.description)}"><meta name="robots" content="${m.robots}">${m.canonical?`<link rel="canonical" href="${escape(m.canonical)}">`:''}<meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="VOLTÉO">${m.canonical?`<meta property="og:url" content="${escape(m.canonical)}">`:''}${img?`<meta property="og:image" content="${escape(img)}"><meta property="og:image:alt" content="Voiture concept électrique VOLTÉO">`:''}<meta name="twitter:card" content="summary_large_image">${graph?`<script id="volteo-jsonld" type="application/ld+json">${JSON.stringify(graph).replaceAll('<','\\u003c')}</script>`:''}`;
 out=out.replace('</head>',head+'</head>');if(body)out=out.replace('<div id="root"></div>','<div id="root" data-prerendered="public">'+body+'</div>');return out;
}
const server=await createServer({server:{middlewareMode:true},appType:'custom',mode:'production'});
try{
 const {PublicRoot}=await server.ssrLoadModule('/src/PublicLanding.jsx');
 for(const path of publicPaths){const target='dist'+path+'.html';await fs.mkdir(pathModule.dirname(target),{recursive:true});await fs.writeFile(target,html(path,renderToString(React.createElement(PublicRoot,{path}))));}
 for(const path of [...appPaths,...vehicles.map(v=>'/vehicules/'+v.slug)]){const target=path==='/'?'dist/index.html':'dist'+path+'.html';await fs.mkdir(pathModule.dirname(target),{recursive:true});await fs.writeFile(target,html(path));}
 await fs.writeFile('dist/404.html',html('/404'));
 const indexable=[...appPaths,...publicPaths].filter(path=>metadata(path,origin).robots.startsWith('index'));
 await fs.writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexable.map(path=>`<url><loc>${escape(origin+path)}</loc></url>`).join('')+'</urlset>\n');
 await fs.writeFile('dist/robots.txt',origin?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
 // A real 404 response replaces the former catch-all 200 rewrite. Known SPA
 // routes each have their own HTML file, generated above.
 await fs.writeFile('dist/_redirects','# Extensionless routes resolve to generated HTML files. No catch-all 200.\n');
 await fs.writeFile('dist/_headers','/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
 console.log(`SEO: ${publicPaths.length} pages éditoriales pré-rendues, ${indexable.length} URL dans le sitemap. ${origin||'Domaine absent : noindex.'}`);
}finally{await server.close();}
