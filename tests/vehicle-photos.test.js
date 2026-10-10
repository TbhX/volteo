import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const photos=JSON.parse(fs.readFileSync(new URL('../src/vehicle-photos.json',import.meta.url)));
const models=[...JSON.parse(fs.readFileSync(new URL('../server/vehicles.json',import.meta.url))),...JSON.parse(fs.readFileSync(new URL('../src/market-models.json',import.meta.url)))];
test('catalogue photos have local WebP assets, dimensions and attribution',()=>{
 for(const [slug,p] of Object.entries(photos)){
  assert(models.some(v=>v.slug===slug),`Unknown model ${slug}`);
  for(const key of ['src','small']){
   assert.match(p[key],/^\/images\/vehicles\/[a-z0-9-]+\.webp$/);
   const bytes=fs.readFileSync(new URL('../public'+p[key],import.meta.url));
   assert.equal(bytes.subarray(0,4).toString(),'RIFF',slug);
   assert.equal(bytes.subarray(8,12).toString(),'WEBP',slug);
  }
  assert(p.width>=640&&p.height>0,slug);
  assert(p.author&&p.license&&p.changes&&p.alt,slug);
  assert.match(p.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.match(p.licenseUrl,/^https?:\/\//);
 }
});
