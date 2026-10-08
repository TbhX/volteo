import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {publicPages} from '../src/public-content.js';
const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
for(const path of Object.keys(publicPages)){
 const html=await fs.readFile('dist'+path+'.html','utf8');
 assert(html.includes('data-prerendered="public"'));
 assert(html.includes(publicPages[path].heading));
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.equal((html.match(/<title>/g)||[]).length,1);
 assert(html.includes('<meta name="robots"'));
 assert(!html.includes('admin / admin'));
}
for(const path of ['/admin','/admin/gestion','/compte','/tableau-de-bord','/connexion']){
 const html=await fs.readFile('dist'+path+'.html','utf8');assert(html.includes('noindex,follow'));assert(!sitemap.includes('<loc>https://volteo.example'+path+'</loc>'));
}
assert((await fs.readFile('dist/404.html','utf8')).includes('noindex,follow'));
await assert.rejects(fs.access('dist/demo-pro.html'));
assert(!(await fs.readFile('dist/_redirects','utf8')).includes('/* /index.html 200'));
console.log('SEO build: public HTML, private noindex, 404, sitemap and demo exclusion passed.');
