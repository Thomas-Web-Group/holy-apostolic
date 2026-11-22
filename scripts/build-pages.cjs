'use strict';
// Build public HTML from the same source renderers used by the interactive views.
// This runs at build time only. No browser storage or account data is read.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {parseHTML}=require('linkedom');
const dist=path.resolve(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(dist,file),'utf8'));
const write=(file,value)=>{const target=path.resolve(dist,file);if(!target.startsWith(dist+path.sep))throw Error('Invalid generated path');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
const json=(file,value)=>write('page-data/'+file+'.json',JSON.stringify(value)+'\n');
const plain=value=>JSON.parse(JSON.stringify(value)),unique=items=>[...new Map(items.filter(Boolean).map(item=>[item.id,item])).values()];
const canonical=route=>{const [pathname,query='']=route.replace(/^#?\//,'').split('?');return '/'+(pathname==='home'?'':pathname+'/')+(query?'?'+query:'');};
async function build(){
 require('./build-saint-references.cjs').build();
 const template=fs.readFileSync(path.join(__dirname,'../templates/page.html'),'utf8');
 const {document,window:dom}=parseHTML(template),main=document.getElementById('main');
 const selectValue=Object.getOwnPropertyDescriptor(dom.HTMLSelectElement.prototype,'value');Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get:selectValue.get,set(value){for(const option of this.querySelectorAll('option'))option.selected=option.value===String(value);}});
 const ctx={document,console,URL,URLSearchParams,AbortController,Map,Set,Date,JSON,Promise,Blob,TextEncoder,TextDecoder,Node:dom.Node,NodeFilter:{SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2},HTMLElement:dom.HTMLElement,CSS:{escape:s=>s.replace(/[^a-z0-9_-]/gi,'\\$&')},location:new URL('http://127.0.0.1:4317/'),history:{replaceState(){},pushState(){}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{onLine:true},matchMedia:()=>({matches:false,addEventListener(){}}),MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},addEventListener(){},removeEventListener(){},scrollTo(){},scrollY:0,innerWidth:1440,innerHeight:1000,confirm:()=>false};
 ctx.window=ctx;ctx.globalThis=ctx;ctx.fetch=async file=>({ok:true,json:async()=>read(String(file).replace(/^\//,''))});
 ctx.ScripturePreviews={enhance(){},close(){},manifest:async()=>read('scripture/manifest.json')};ctx.GlossaryPreviews={configure(){},enhance(){},close(){}};
 ctx.OrthodoxAccounts={ready:async()=>{},storageKey:key=>key,user:()=>null,status:()=>({}),changed(){},connect(){},configured:()=>false};
 ctx.OrthodoxStudyTools={snapshot:()=>({}),connect(){},validate(){},get:()=>({corrections:[]})};ctx.OrthodoxOffline={unmount(){}};ctx.OrthodoxNavigation={markup:()=>''};
 ctx.OrthodoxWelcome={homeMarkup:main.innerHTML,syncAccount(){},release(){},loading:()=>''};
 vm.createContext(ctx);
 for(const file of ['saint-references-data','saint-references','visuals','references','lesson-teaching','editorial','study','saints','icons','formation','worship-year','church-guide','authority','timeline'])vm.runInContext(fs.readFileSync(path.join(dist,file+'.js'),'utf8'),ctx,{filename:file+'.js'});
 // Export the pure views without executing the browser startup path.
 let app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
 app=app.replace(/await window\.OrthodoxAccounts\.ready\(\);/,'');
 const marker='  window.OrthodoxWelcome.release();';
 if(!app.includes(marker))throw Error('Build export marker missing');
 app=app.slice(0,app.indexOf(marker))+`  globalThis.__views={lessonPage,prayerPage,explorePage,aboutPage,sourcesPage,updateSources,libraryPage,settingsPage,connectStudyMetadata,set(value){({modules,lessons,sources,prayers,glossary,nativePrayers,loadedMetadata,extras}=value);sourceMap=new Map(sources.map(s=>[s.id,s]));lessonMap=new Map(lessons.map(l=>[l.id,l]));catalogReady=true;},get:()=>({modules,lessons,sources,prayers,glossary,nativePrayers,extras})};\n})();`;
 vm.runInContext(app,ctx,{filename:'app-build.js'});
 await Promise.resolve();
 const loaded=['quoted-doctrine','quoted-worship','quoted-history-comparisons','expanded-curriculum','further-curriculum'].map(name=>read('content/'+name+'.json')),depth=read('content/curriculum-depth.json');
 const modules=loaded.flatMap(d=>d.modules||[]).sort((a,b)=>a.order-b.order);
 for(const addition of depth.lessonAdditions){const module=modules.find(m=>m.id===addition.moduleId);if(!module)throw Error('Missing module');module.lessons.push(...addition.lessons);}
 const glossary=read('content/glossary.json'),supplement=read('content/glossary-supplement.json'),prayerData=read('content/prayer-library.json');
 glossary.terms=unique([...glossary.terms,...supplement.terms,...depth.glossaryAdditions]);glossary.enrichment=supplement.enrichment||supplement.existingTermEnrichment||{};
 const extras={};for(const [key,name]of Object.entries({saints:'Saints',icons:'Icons',formation:'Formation',worship:'WorshipYear',church:'ChurchGuide',authority:'Authority',history:'Timeline'}))extras[key]=await ctx['Orthodox'+name].load();
 for(const item of extras.formation.glossarySupport||[])glossary.enrichment[item.termId]=item;
 const sources=unique([...loaded.flatMap(d=>d.sources||[]),...depth.sources,...glossary.sources,...supplement.sources,...prayerData.sources,...Object.values(extras).flatMap(d=>d.sources||[]),...read('scripture/manifest.json').sources]);
 const verification=new Map(read('content/release-inventory.json').sources.map(s=>[s.id,s.verification]));for(const source of sources)if(verification.has(source.id))source.textVerification=verification.get(source.id);const sourceMap=new Map(sources.map(s=>[s.id,s]));await ctx.OrthodoxEditorial.load(sourceMap);
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const lessons=modules.flatMap(module=>module.lessons.map(lesson=>{lesson.module=module;lesson.search=normalize([lesson.title,module.title,...(lesson.tags||[]),...lesson.readings.flatMap(r=>[r.title,r.text,r.locator,[sourceMap.get(r.sourceId)?.author,sourceMap.get(r.sourceId)?.title,sourceMap.get(r.sourceId)?.work,sourceMap.get(r.sourceId)?.edition,sourceMap.get(r.sourceId)?.translator].join(' ')]),...(lesson.scripture||[]).flatMap(r=>[r.reference,r.text])].join(' '));return lesson;}));
 const explanations=read('content/lesson-explanations.json'),explanationMap=new Map(explanations.lessons.map(l=>[l.id,l]));if(explanationMap.size!==lessons.length)throw Error('Every lesson requires a source-grounded explanation');for(const lesson of lessons){const explanation=explanationMap.get(lesson.id);if(!explanation||explanation.readings.length!==lesson.readings.length)throw Error('Incomplete lesson explanation: '+lesson.id);lesson.explanation=explanation;lesson.sourceRevision=lesson.revision||'source-readings-2026-11-19';lesson.revision=explanations.revision;lesson.search+=' '+normalize([...explanation.overview,...explanation.readings.flatMap(r=>r.paragraphs)].map(p=>p.text).join(' '));}
 const prayers=loaded.flatMap(d=>d.prayers||[]),nativePrayers=prayerData.prayers;
 ctx.__views.set({modules,lessons,sources,prayers,glossary,nativePrayers,loadedMetadata:loaded.find(d=>d.existingLessonMetadata||d.lessonMetadata)?.existingLessonMetadata||{},extras});ctx.__views.connectStudyMetadata();
 const lessonMeta=lesson=>({id:lesson.id,title:lesson.title,moduleId:lesson.module.id,revision:lesson.revision,depth:lesson.depth,stages:lesson.stages,topics:lesson.topics,prerequisites:lesson.prerequisites,readings:lesson.readings.map(()=>({})),scripture:[],words:[...lesson.readings,...(lesson.scripture||[])].reduce((n,r)=>n+(r.text?.trim().split(/\s+/).length||0),0),search:normalize([lesson.title,lesson.module.title,...(lesson.tags||[]),...(lesson.topics||[])].join(' '))});
 for(const term of glossary.terms)term.lessonIds=[...new Set([...(term.lessonIds||[]),...lessons.filter(l=>l.termIds.includes(term.id)).map(l=>l.id)])];
 const catalog={modules:modules.map(m=>({id:m.id,title:m.title,order:m.order,track:m.track,lessonIds:m.lessons.map(l=>l.id)})),lessons:lessons.map(lessonMeta),prayers,counts:{lessons:lessons.length,modules:modules.length,saints:extras.saints.saints.length,icons:extras.icons.profiles.length,terms:glossary.terms.length,prayers:nativePrayers.length}};
 json('formation-readings',{lessons:lessons.map(l=>({id:l.id,readings:l.readings.filter(r=>r.kind==='quotation'),scripture:l.scripture||[]})),sources:sources.filter(s=>lessons.some(l=>[...l.readings,...(l.scripture||[])].some(r=>r.sourceId===s.id)))});const reviewPrayers=nativePrayers.filter(p=>p.length==='short'&&!p.publishedRule&&p.use==='private'),reviewTerms=glossary.terms.filter(t=>t.definition.kind==='quotation').map(t=>({id:t.id,term:t.term,definition:t.definition})),reviewSourceIds=new Set([...reviewPrayers.map(p=>p.sourceId),...reviewTerms.flatMap(t=>(t.definition.sourceRefs||[{sourceId:t.definition.sourceId}]).map(r=>r.sourceId))]);json('review',{prayers:reviewPrayers,glossary:{terms:reviewTerms},sources:sources.filter(s=>reviewSourceIds.has(s.id))});
 json('catalog',catalog);json('search',lessons.map(l=>({id:l.id,text:l.search})));json('sources',sources);
 const termPayload=terms=>({terms,sources:unique(terms.flatMap(term=>(term.definition.sourceRefs||[{sourceId:term.definition.sourceId}]).map(ref=>sourceMap.get(ref.sourceId)))),enrichment:Object.fromEntries(terms.filter(t=>glossary.enrichment[t.id]).map(t=>[t.id,glossary.enrichment[t.id]]))});
 json('glossary',termPayload(glossary.terms));
 for(const lesson of lessons){const {module,search,...fields}=lesson;json('lessons/'+lesson.id,{lesson:{...fields,moduleId:module.id,termLinks:glossary.terms.filter(t=>lesson.termIds.includes(t.id)).map(t=>({id:t.id,term:t.term}))},sources:unique([...lesson.readings,...(lesson.scripture||[]),...ctx.OrthodoxLessons.refs(lesson)].map(r=>sourceMap.get(r.sourceId)))});}
 json('prayers/index',{prayers:nativePrayers.map(p=>({...p,blocks:[{text:normalize(p.blocks.map(b=>b.text).join(' '))}]})),sources:prayerData.sources});
 for(const prayer of nativePrayers)json('prayers/'+prayer.id,{prayer,sources:prayerData.sources});
 const saints=extras.saints,icons=extras.icons;
 const sourceIds=value=>{const found=new Set();function visit(item){if(!item||typeof item!=='object')return;for(const [key,child]of Object.entries(item)){if(key==='sourceId'&&typeof child==='string')found.add(child);else if(key==='additionalSourceIds'&&Array.isArray(child))child.forEach(id=>found.add(id));else if(typeof child==='object')visit(child);}}visit(value);return found;};
 const saintIndex=saints.saints.map(s=>({...s,readings:s.readings?.map(r=>({title:r.title,text:''})),searchText:normalize([s.name,...(s.aliases||[]),s.summary.text,...(saints.biographies.get(s.id)?.sections||[]).flatMap(section=>section.blocks.map(b=>b.text))].join(' '))}));
 const baseSaints={scope:saints.scope,calendarNote:saints.calendarNote,images:[...saints.images.values()],biographies:[...saints.biographies.values()].map(p=>({saintId:p.saintId,death:p.death})),sources:[]};
 json('saints/index',{...baseSaints,saints:saintIndex.map(({searchText,...s})=>({...s,hasPublishedReadings:Boolean(s.readings?.length||(saints.biographies.get(s.id)?.sections||[]).some(section=>section.blocks.some(b=>b.kind==='quotation')))}))});
 json('saints/search',saintIndex.map(s=>({id:s.id,text:s.searchText})));
 for(const saint of saints.saints){const profile=saints.biographies.get(saint.id);json('saints/'+saint.id,{calendarNote:saints.calendarNote,saints:[saint],images:[saints.images.get(saint.id)].filter(Boolean),biographies:[profile].filter(Boolean),sources:saints.sources.filter(s=>sourceIds([saint,profile]).has(s.id))});}
 // Gallery descriptions stay small. The full sources and sections load for one icon.
 json('icons/search',icons.profiles.map(p=>({id:p.id,text:normalize([p.title,...p.aliases,p.subject,p.overview.text,...p.sections.flatMap(section=>section.blocks.map(b=>b.text))].join(' '))})));
 json('icons/index',{...icons,profiles:icons.profiles.map(p=>({...p,sections:[],overview:p.overview})),images:[...icons.images.values()],sources:[]});
 for(const profile of icons.profiles)json('icons/'+profile.id,{...icons,profiles:[profile,...(profile.relatedIconIds||[]).map(id=>icons.profiles.find(p=>p.id===id)).filter(Boolean).map(p=>({id:p.id,title:p.title}))],images:[icons.images.get(profile.id)].filter(Boolean),sources:icons.sources.filter(s=>sourceIds(profile).has(s.id))});
 const pages=[],state={completed:[],bookmarks:[],notes:{},prayerFavorites:[],prayerReadingScroll:{},preferences:{},readRevisions:{}};
 const mountCtx=()=>({root:main,lessons,modules,glossary,nativePrayers,prayers:nativePrayers,originalPrayers:prayers,sources:sourceMap,getState:()=>state,save(){},done:()=>false,revised:()=>false,resume:lessons[0],toast(){},params:new URLSearchParams()});
 function transform(root){for(const element of root.querySelectorAll('[href],[src],[action]'))for(const attribute of ['href','src','action']){const value=element.getAttribute(attribute);if(!value)continue;if(value.startsWith('#/'))element.setAttribute(attribute,canonical(value));else if(!/^(?:#|\/|[a-z]+:)/i.test(value))element.setAttribute(attribute,'/'+value);}for(const image of root.querySelectorAll('img'))image.setAttribute('decoding','async');}
 function emit(route,title){const url=canonical(route),section=route.split('/')[0];const {document:out}=parseHTML(template);const target=out.getElementById('main');target.innerHTML=main.innerHTML;target.dataset.route='#/'+route;target.dataset.static='true';ctx.OrthodoxSaintReferences.enhance(target,{route:'#/'+route});title=route.startsWith('saint/')?(ctx.OrthodoxSaintReferences.displayName(route.split('/')[1])||title):title;ctx.OrthodoxReferences.collapse(target);for(const el of target.querySelectorAll('button,input,select'))el.disabled=true;for(const el of target.querySelectorAll('#lesson-note,#general-journal'))el.setAttribute('readonly','');out.body.classList.toggle('landing-page',route==='home');out.title=title==='Holy Apostolic'?title:title+' · Holy Apostolic';out.getElementById('breadcrumb').textContent=title;for(const link of out.querySelectorAll('#nav a')){const active=link.getAttribute('href')==='#/'+({lesson:'learn',saint:'saints',icon:'icons',prayer:'prayers',term:'glossary',service:'services'}[section]||section);link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}transform(out);const canonicalLink=out.createElement('link');canonicalLink.rel='canonical';canonicalLink.href='https://holyapostolic.com'+url;out.head.append(canonicalLink);write(url==='/'?'index.html':url.slice(1)+'index.html','<!doctype html>\n'+out.documentElement.outerHTML+'\n');pages.push({url,title,route:'#/'+route});}
 const home=main.innerHTML;emit('home','Holy Apostolic');
 for(const lesson of lessons){main.innerHTML=ctx.__views.lessonPage(lesson.id);emit('lesson/'+lesson.id,lesson.title);}
 for(const [kind,items,api]of [['saint',saints.saints,ctx.OrthodoxSaints],['icon',icons.profiles,ctx.OrthodoxIcons]])for(const item of items){await api.mount({...mountCtx(),id:item.id});emit(kind+'/'+item.id,item.name||item.title);api.unmount();}
 for(const prayer of nativePrayers){ctx.OrthodoxStudy.mount({...mountCtx(),kind:'prayer',id:prayer.id});emit('prayer/'+prayer.id,ctx.OrthodoxEditorial.prayerTitle(prayer));ctx.OrthodoxStudy.unmount();}
 for(const prayer of prayers){main.innerHTML=ctx.__views.prayerPage(prayer.id);emit('prayer/'+prayer.id,prayer.title);}
 for(const term of glossary.terms){ctx.OrthodoxStudy.mount({...mountCtx(),kind:'term',id:term.id});emit('term/'+term.id,term.term);ctx.OrthodoxStudy.unmount();}
 const sections={explore:'Explore',learn:'Learn',glossary:'Glossary',prayers:'Prayers',saints:'Saints',icons:'Icons',services:'Services','church-year':'Church year',church:'Inside the church',authority:'Church authority',timeline:'History timeline',coverage:'Learning map','protestant-path':'Protestant background','scripture-library':'Scripture and Fathers','source-guide':'Source guide',sources:'Sources',about:'About',privacy:'Privacy and saved data'};
 for(const [route,title]of Object.entries(sections)){
   const config=mountCtx();
   if(route==='explore')main.innerHTML=ctx.__views.explorePage();
   else if(['learn','glossary','prayers'].includes(route))ctx.OrthodoxStudy.mount({...config,kind:route==='learn'?'course':route});
   else if(route==='saints')await ctx.OrthodoxSaints.mount(config);
   else if(route==='icons')await ctx.OrthodoxIcons.mount(config);
   else if(['services','church-year'].includes(route))await ctx.OrthodoxWorshipYear.mount({...config,kind:route});
   else if(route==='church')await ctx.OrthodoxChurchGuide.mount(config);
   else if(route==='authority')await ctx.OrthodoxAuthority.mount(config);
   else if(route==='timeline')await ctx.OrthodoxTimeline.mount(main,new URLSearchParams());
   else if(['coverage','protestant-path','scripture-library','source-guide'].includes(route))ctx.OrthodoxFormation.mount({...config,kind:route});
   else if(route==='sources'){main.innerHTML=ctx.__views.sourcesPage();ctx.__views.updateSources();}
   else if(route==='about')main.innerHTML=ctx.__views.aboutPage();
   else await ctx.OrthodoxEditorial.mount({...config,kind:'privacy'});
   emit(route,title);for(const api of [ctx.OrthodoxStudy,ctx.OrthodoxSaints,ctx.OrthodoxIcons,ctx.OrthodoxWorshipYear,ctx.OrthodoxChurchGuide,ctx.OrthodoxAuthority,ctx.OrthodoxFormation,ctx.OrthodoxEditorial])api.unmount?.();
 }
 for(const service of extras.worship.services||[]){await ctx.OrthodoxWorshipYear.mount({...mountCtx(),kind:'service',id:service.id});emit('service/'+service.id,service.title);ctx.OrthodoxWorshipYear.unmount();}
 for(const [route,title]of Object.entries({account:'Account',settings:'Settings',notebook:'Study notebook',journal:'Lesson notes','review-cards':'Review cards',editorial:'Editorial review',release:'Source inventory',offline:'Offline reading',library:'Search'})){main.innerHTML='<h1>'+title+'</h1><p role="status">Loading '+(route==='account'?'account options':route==='library'?'search tools':'your saved study tools')+'…</p><noscript>Enable JavaScript to use this feature. Public readings and source references remain available.</noscript>';emit(route,title);}
 const files=pages.map(p=>p.url==='/'?'index.html':p.url.slice(1)+'index.html');
 write('page-manifest.json',JSON.stringify({schema:1,pages,files,counts:catalog.counts},null,2)+'\n');
 const sizes={};for(const name of ['catalog','prayers/index','saints/index','icons/index','glossary','search','sources'])sizes[name]=fs.statSync(path.join(dist,'page-data',name+'.json')).size;
 console.log(JSON.stringify({pages:pages.length,counts:catalog.counts,indexBytes:sizes,htmlBytes:files.reduce((n,file)=>n+fs.statSync(path.join(dist,file)).size,0)},null,2));
}
if(require.main===module)build().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={build};
