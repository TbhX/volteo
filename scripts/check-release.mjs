import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='dist';const photos=JSON.parse(fs.readFileSync('src/vehicle-photos.json'));
const models=[...JSON.parse(fs.readFileSync('server/vehicles.json')),...JSON.parse(fs.readFileSync('src/market-models.json'))];
for(const v of models){
 assert.equal(fs.existsSync(`${root}/vehicules/${v.slug}.html`),!!photos[v.slug],v.slug+' route/photo mismatch');
 if(!photos[v.slug])continue;
 for(const key of ['src','small']){const bytes=fs.readFileSync(root+photos[v.slug][key]);assert.equal(bytes.subarray(8,12).toString(),'WEBP',v.slug+' invalid photo');}
}
const headers=fs.readFileSync(root+'/_headers','utf8');
for(const expected of ['Content-Security-Policy:',"frame-ancestors 'none'",'X-Frame-Options: DENY','Referrer-Policy: no-referrer'])assert(headers.includes(expected),expected);
assert(!/script-src[^;]*unsafe-/.test(headers));
assert(!fs.existsSync(root+'/demo-pro.html'));
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())scan(path);else if(/\.(js|html|json|map)$/.test(path)){const s=fs.readFileSync(path,'utf8');assert(!/sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s),'Private credential in '+path);}}}
scan(root);console.log('Release checks passed: illustrated routes, photo assets, security headers, demo exclusion and credential patterns.');
