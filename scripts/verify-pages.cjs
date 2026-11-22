'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const dist=path.resolve(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(dist,file),'utf8'));
const manifest=read('page-manifest.json'),catalog=read('page-data/catalog.json');let assertions=0,quotedReadings=0,prayerBlocks=0;
const ok=(value,message)=>{assert.ok(value,message);assertions++;};
const documentFor=file=>parseHTML(fs.readFileSync(path.join(dist,file),'utf8')).document;
const paragraphs=text=>String(text).split(/\n\s*\n/).map(p=>p.replace(/\n/g,''));
const textOf=element=>[...element.querySelectorAll('p')].map(p=>{const copy=p.cloneNode(true);for(const span of copy.querySelectorAll('[data-saint-honorific]'))span.remove();return copy.textContent;});
ok(manifest.pages.length===1044+read('content/saints-reference-additions.json').saints.length,'All stable public routes and newly referenced Saints generated');
ok(catalog.lessons.length===229&&catalog.modules.length===46,'Complete browsing metadata');
const paths=new Set(manifest.pages.map(page=>page.url));
for(const entry of manifest.pages){
 const file=entry.url==='/'?'index.html':entry.url.slice(1)+'index.html',document=documentFor(file),main=document.getElementById('main');
 ok(Boolean(main?.querySelector('h1')),'Visible heading: '+file);
 ok(document.querySelector('link[rel="icon"]')?.getAttribute('href')==='/favicon.svg','Root-safe favicon: '+file);
 ok(document.querySelector('link[rel="canonical"]')?.getAttribute('href')==='https://holyapostolic.com'+entry.url,'Canonical URL: '+file);
 ok(!document.querySelector('script[src="/app.js"]'),'Progress cannot block static parsing: '+file);
 for(const element of document.querySelectorAll('[src],a[href]')){
   const attribute=element.hasAttribute('src')?'src':'href',value=element.getAttribute(attribute);if(!value||!value.startsWith('/'))continue;
   const url=new URL(value,'https://holyapostolic.com');let target=url.pathname;if(target.endsWith('/'))ok(paths.has(target),'Known page link '+value+' in '+file);else ok(fs.existsSync(path.join(dist,decodeURIComponent(target.slice(1)))),'Real public asset '+value+' in '+file);
 }
 if(entry.route.startsWith('#/lesson/')){
   ok(main.querySelector('#lesson-note')?.hasAttribute('readonly'),'Static notes await progress');const id=entry.route.split('/')[2],{lesson,sources}=read('page-data/lessons/'+id+'.json');
   for(const [index,reading]of lesson.readings.entries())if(reading.kind==='quotation'){
     const quote=main.querySelector('#reading-'+(index+1)+' .quoted-reading');ok(Boolean(quote),'Quote block '+id+' '+index);assert.deepEqual(textOf(quote),paragraphs(reading.text),'Exact published lesson text: '+id);assertions++;quotedReadings++;
     ok(!quote.querySelector('[data-saint-honorific]'),'No added words in published quotation '+id);
   }
   for(const source of sources)ok(Boolean(main.querySelector('[id="fn-'+source.id+'"]')),'Lesson source footnote: '+id+' '+source.id);
 }
 if(entry.route.startsWith('#/prayer/np-')){
   const id=entry.route.split('/')[2],{prayer}=read('page-data/prayers/'+id+'.json'),blocks=main.querySelectorAll('[data-prayer-block]');ok(blocks.length===prayer.blocks.length,'Complete prayer unit '+id);
   for(const [index,block]of prayer.blocks.entries()){const node=blocks[index];ok(!node.querySelector('[data-saint-honorific]'),'No added words in complete prayer '+id);if(block.kind==='heading')ok(node.querySelector('h2')?.textContent===block.text,'Exact prayer heading '+id);else {assert.deepEqual(textOf(node),paragraphs(block.text),'Exact prayer block '+id+' '+index);assertions++;}prayerBlocks++;}
 }
 if(entry.route.startsWith('#/saint/')){
   const id=entry.route.split('/')[2],data=read('page-data/saints/'+id+'.json');assert.deepEqual(textOf(main.querySelector('.saint-summary')),paragraphs(data.saints[0].summary.text),'Original Saint introduction '+id);assertions++;ok(Boolean(main.querySelector('#saint-sources')),'Saint source section '+id);
   const profile=data.biographies[0];for(const section of profile?.sections||[])for(const [index,block]of section.blocks.entries()){const root=main.querySelector('[data-study-scope="saint-biography-'+section.id+'-'+index+'"]'),reading=root?.querySelector(block.kind==='quotation'?'blockquote':'.saint-biography-summary');ok(Boolean(reading),'Biography block '+id);assert.deepEqual(textOf(reading),paragraphs(block.text),'Exact biography wording '+id);assertions++;}
 }
 if(entry.route.startsWith('#/term/'))ok(main.querySelectorAll('.source-footnotes li').length>0,'Term source references '+entry.route);
 if(entry.route.startsWith('#/icon/'))ok(Boolean(main.querySelector('#icon-sources')),'Icon sources '+entry.route);
}
ok(!fs.existsSync(path.join(dist,'page-template.html')),'Build template stays outside public output');
ok(!manifest.files.some(file=>/\.env|node_modules|\.runtime|api\//.test(file)),'Generated manifest contains public pages only');
console.log(JSON.stringify({staticPages:manifest.pages.length,assertions,quotedReadings,prayerBlocks,issues:[]},null,2));
