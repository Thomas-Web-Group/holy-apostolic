'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'../dist/content'),raw=fs.readFileSync(path.join(base,'saints.json')),data=JSON.parse(raw),audit=JSON.parse(fs.readFileSync(path.join(base,'saints-audit.json'))),issues=[];
const check=(ok,message)=>{if(!ok)issues.push(message);},hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const checks=new Map(audit.checks.map(row=>[row.key,row])),sources=new Map(data.sources.map(s=>[s.id,s])),ids=new Set();let native=0,words=0,women=0;
const lessons=new Set(['quoted-doctrine.json','quoted-worship.json','quoted-history-comparisons.json','expanded-curriculum.json'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(base,name))).modules.flatMap(m=>m.lessons.map(l=>l.id))));
check(hash(raw)===audit.contentSHA256,'Saints content differs from recorded source audit');
for(const source of data.sources){check(/^sa-/.test(source.id),'Unscoped source ID '+source.id);check(['title','author','work','edition','url','type','rights'].every(key=>typeof source[key]==='string'&&source[key].trim()),'Missing source metadata '+source.id);try{check(new URL(source.url).protocol==='https:','Non-HTTPS source '+source.id);}catch{check(false,'Invalid source URL '+source.id);}}
for(const saint of data.saints){
 check(!ids.has(saint.id),'Duplicate saint '+saint.id);ids.add(saint.id);check(/^[a-z0-9-]+$/.test(saint.id),'Invalid saint ID');
 check(['name','sourceTitle','era','region','dates','context'].every(key=>typeof saint[key]==='string'&&saint[key].trim()),'Missing profile context '+saint.id);
 check(sources.has(saint.sourceId),'Missing biography source '+saint.id);check(saint.types.length>0,'Missing vocation '+saint.id);if(saint.types.includes('Woman'))women++;
 const date=saint.commemoration;check(Number.isInteger(date.month)&&date.month>=1&&date.month<=12&&date.day>=1&&date.day<=new Date(Date.UTC(2024,date.month,0)).getUTCDate(),'Invalid commemoration '+saint.id);
 check(saint.summary.kind==='summary'&&saint.summary.reason&&saint.summary.locator&&sources.has(saint.summary.sourceId),'Unlabelled/unsourced summary '+saint.id);
 check(checks.get('saint/'+saint.id+'/summary')?.textSHA256===hash(saint.summary.text),'Summary audit mismatch '+saint.id);
 check(saint.excerpt.kind==='quotation'&&saint.excerpt.text.endsWith(' …'),'Excerpt omission not explicit '+saint.id);
 const excerpt=saint.excerpt.text.slice(0,-2).trim();check(excerpt.split(/\s+/).length<=25,'Modern-source quotation budget exceeded '+saint.id);
 check(checks.get('saint/'+saint.id+'/excerpt')?.textSHA256===hash(excerpt),'Excerpt audit mismatch '+saint.id);
 for(const id of saint.relatedLessons)check(lessons.has(id),'Broken related lesson '+saint.id+':'+id);
 for(const id of saint.additionalSourceIds||[])check(sources.has(id),'Broken additional source '+id);
 for(const [index,reading]of saint.readings.entries()){
  native++;words+=reading.text.split(/\s+/).length;check(reading.kind==='quotation'&&reading.title&&reading.locator&&reading.context,'Missing reading attribution '+saint.id);
  check(sources.has(reading.sourceId),'Missing reading source '+reading.sourceId);
  const candidates=['saint/'+saint.id+'/reading/'+index,'saint/'+saint.id+'/scripture'];check(candidates.some(key=>checks.get(key)?.textSHA256===hash(reading.text)&&checks.get(key)?.match),'Reading audit mismatch '+saint.id+':'+index);
  check(!/Please help support|all for only \$19\.99|New Advent LLC|About this page/.test(reading.text),'Site material leaked into reading '+saint.id);
 }
}
check(data.saints.length===audit.profiles&&native===audit.nativeReadings&&words===audit.nativeWords,'Catalogue counts differ from audit');
check(data.saints.length>=75&&women>=15,'Broad profile coverage reduced');
check(new Set(data.saints.map(s=>s.era)).size>=6,'Historical era coverage reduced');
const polycarp=data.saints.find(s=>s.id==='polycarp');check(polycarp.readings.some(r=>r.title.includes('complete epistle')&&r.text.includes('Chapter XIV.')),'Complete Polycarp epistle missing');
check(data.saints.find(s=>s.id==='antony').readings.some(r=>r.text.includes('94.')),'Life of Antony ending missing');
check(data.saints.find(s=>s.id==='olga-kwethluk').commemoration.month===10&&data.saints.find(s=>s.id==='olga-kwethluk').commemoration.day===27,'Olga feast date correction lost');
check(data.saints.find(s=>s.id==='demetrius').sourceTitle.includes('Thessaloniki'),'Same-name Demetrius source confused');
console.log(JSON.stringify({saints:data.saints.length,womenProfiles:women,nativeReadings:native,profilesWithNativeReadings:data.saints.filter(s=>s.readings.length).length,nativeWords:words,sourceRecords:data.sources.length,sourceMatchedChecks:audit.quotationChecks,issues},null,2));
if(issues.length)process.exitCode=1;
