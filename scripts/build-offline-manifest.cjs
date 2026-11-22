'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dist=path.join(__dirname,'../dist'),list=(folder,accept=()=>true)=>fs.readdirSync(path.join(dist,folder),{withFileTypes:true}).filter(p=>p.isFile()&&accept(p.name)).map(p=>path.posix.join(folder,p.name));
const assets=folder=>fs.existsSync(path.join(dist,folder))?fs.readdirSync(path.join(dist,folder),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?assets(path.posix.join(folder,entry.name)):/\.(?:svg|png|jpe?g|webp)$/i.test(entry.name)?[path.posix.join(folder,entry.name)]:[]):[];
const generated=JSON.parse(fs.readFileSync(path.join(dist,'page-manifest.json'),'utf8'));const derived=folder=>fs.readdirSync(path.join(dist,folder),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?derived(path.posix.join(folder,entry.name)):[path.posix.join(folder,entry.name)]);
const readings=[...generated.files,...derived('page-data'),'page-manifest.json',...list('',n=>/\.(html|css|js|svg|webmanifest)$/.test(n)&&n!=='sw.js'),...list('content',n=>n.endsWith('.json')),'scripture/manifest.json','scripture/reference-context.json',...list('licenses'),...assets('assets')];
const definitions=[['readings','Lessons, Saints, icons, glossary and prayers','All included text readings, artwork, catalogue data, source credits and app interface',readings],['kjv','King James Bible','All included KJV books, including the separately identified Apocrypha',list('scripture/kjv')],['brenton','Brenton Septuagint','All included Greek Old Testament book units and Psalm 151',list('scripture/brenton')],['services','Complete original service pages','Published facsimile PDFs for Vespers, Matins and the Divine Liturgy',list('services',n=>n.endsWith('.pdf'))]];
const hash=crypto.createHash('sha256');
const packs=definitions.map(([id,label,description,files])=>{
  files=[...new Set(files)].sort();let bytes=0;
  for(const file of files){const contents=fs.readFileSync(path.join(dist,file));bytes+=contents.length;hash.update(file).update(crypto.createHash('sha256').update(contents).digest());}
  return {id,label,description,files,bytes};
});
const manifest={version:'4-'+hash.digest('hex').slice(0,12),packs};
fs.writeFileSync(path.join(dist,'offline-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({version:manifest.version,packs:packs.map(({id,bytes})=>({id,bytes}))}));
