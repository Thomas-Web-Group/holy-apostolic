'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const symbols=read('content/section-symbols.json'),saints=[...read('content/saints.json').saints,...(fs.existsSync(path.join(root,'content/saints-additions.json'))?read('content/saints-additions.json').saints:[])],artwork=read('content/saint-images.json').images;
const modules=['quoted-doctrine.json','quoted-worship.json','quoted-history-comparisons.json','expanded-curriculum.json','further-curriculum.json'].flatMap(file=>read('content/'+file).modules||[]);
assert.equal(symbols.modules.length,modules.length);assert.deepEqual(symbols.modules.map(item=>item.id).sort(),modules.map(item=>item.id).sort());
for(const symbol of [...symbols.modules,...symbols.sections]){assert.match(symbol.path,/^assets\/sections\/[a-z0-9-]+\.svg$/);const svg=fs.readFileSync(path.join(root,symbol.path),'utf8');assert.ok(svg.includes('<svg')&&!/<script|onload=|https?:\/\//i.test(svg.replace('http://www.w3.org/2000/svg','')));}
assert.equal(artwork.length,saints.length);assert.deepEqual(artwork.map(item=>item.saintId).sort(),saints.map(item=>item.id).sort());
const paths=new Map();let bytes=0;
for(const image of artwork){
  assert.match(image.path,/^assets\/(?:saints|icons)\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/);if(paths.has(image.path))assert.equal(paths.get(image.path),image.sha256);paths.set(image.path,image.sha256);
  const file=fs.readFileSync(path.join(root,image.path));assert.equal(file.length,image.bytes);assert.equal(crypto.createHash('sha256').update(file).digest('hex'),image.sha256);bytes+=file.length;
  assert.ok(image.width>0&&image.height>0);assert.ok(image.title&&image.author&&image.identityEvidence&&image.alt);
  assert.match(image.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.match(image.licenseUrl,/^https:\/\/(?:creativecommons\.org|commons\.wikimedia\.org|artlibre\.org)\//);
  assert.match(image.license,/^(?:Public domain|CC0|CC BY(?:-SA)? [1-4]\.[0-9]|FAL|Free Art License)/);assert.ok(!/fair use|non.?commercial|all rights reserved/i.test(image.license));
}
console.log(JSON.stringify({moduleEmblems:symbols.modules.length,sectionEmblems:symbols.sections.length,saintImages:artwork.length,imageBytes:bytes,localAssets:'hash verified',sourceAndLicenseRecords:'present',worldwideRightsClearance:'not claimed; retain file-specific notes',issues:[]},null,2));
