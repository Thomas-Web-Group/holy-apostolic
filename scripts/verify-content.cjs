const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'../dist/content');
const names=['quoted-doctrine.json','quoted-worship.json','quoted-history-comparisons.json'];
const data=names.map(name=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8')));
const audit=JSON.parse(fs.readFileSync(path.join(base,'quotation-audit.json'),'utf8'));
const modules=data.flatMap(d=>d.modules),lessons=modules.flatMap(m=>m.lessons),sources=data.flatMap(d=>d.sources),prayers=data.flatMap(d=>d.prayers||[]);
const issues=[],sourceMap=new Map(sources.map(s=>[s.id,s])),proof=new Map(audit.checks.map(c=>[[c.lessonId,c.kind,c.index].join('/'),c]));
function check(value,message){if(!value)issues.push(message);}
check(modules.length===18&&lessons.length===72,'Curriculum size changed');
check(new Set(modules.map(m=>m.id)).size===modules.length,'Duplicate module IDs');
check(new Set(lessons.map(l=>l.id)).size===lessons.length,'Duplicate lesson IDs');
check(sourceMap.size===sources.length,'Duplicate source IDs');
check(audit.issues.length===0&&audit.exactChecks===audit.matchedChecks,'Quotation audit did not pass');
let quotations=0,links=0,summaries=0,scriptures=0,words=0;
function verifyText(item,lesson,index,kind){
 const known=proof.get([lesson.id,kind,index].join('/'));
 const hash=crypto.createHash('sha256').update(item.text).digest('hex');
 check(known?.match&&known.textSHA256===hash&&known.sourceId===item.sourceId&&known.locator===item.locator,`Text differs from verified source excerpt: ${lesson.id}/${kind}/${index}`);
 words+=item.text.trim().split(/\s+/).length;
}
for(const lesson of lessons){
 for(const field of ['body','summary','reflection','practice','quiz'])check(!(field in lesson),`Generated field remains: ${lesson.id}/${field}`);
 check(lesson.readings?.length>0,`Missing readings: ${lesson.id}`);
 lesson.readings.forEach((item,index)=>{
  check(sourceMap.has(item.sourceId)&&item.title&&item.locator,`Reading metadata: ${lesson.id}/${index}`);
  check(['quotation','summary','link'].includes(item.kind),`Reading type: ${lesson.id}/${index}`);
  if(item.kind==='quotation'){quotations++;verifyText(item,lesson,index,'quotation');}
  if(item.kind==='link'){links++;check(!item.text,`Unlabelled text on link reading: ${lesson.id}/${index}`);}
  if(item.kind==='summary'){summaries++;check(item.text&&(item.reason||item.summaryReason),`Summary requires necessity note: ${lesson.id}/${index}`);}
 });
 (lesson.scripture||[]).forEach((item,index)=>{scriptures++;check(sourceMap.has(item.sourceId)&&item.reference&&item.translation&&item.locator,`Scripture metadata: ${lesson.id}/${index}`);verifyText(item,lesson,index,'scripture');});
}
for(const source of sources){
 for(const field of ['title','url','author','work','tradition','type','rights','rightsNote'])check(Boolean(source[field]),`Source ${field}: ${source.id}`);
 try{check(new URL(source.url).protocol==='https:',`Source must use HTTPS: ${source.id}`);}catch{issues.push(`Invalid URL: ${source.id}`);}
 if(source.attribution)check(source.rightsUrl,`Attribution without permission reference: ${source.id}`);
}
const exactRules={morning:'morning-prayers-longer-rule',work:'for-work',meals:'for-meals',evening:'evening-prayers-longer-rule'};
check(prayers.length===4,'Four original prayer rules required');
for(const prayer of prayers){check(prayer.mode==='linked-rule'&&!prayer.steps?.length,`Replacement prayer steps remain: ${prayer.id}`);check(prayer.sourceUrl===`https://churchmotherofgod.org/prayers/${exactRules[prayer.id]}/`,`Original prayer link changed: ${prayer.id}`);check(sourceMap.has(prayer.sourceId),`Prayer attribution missing: ${prayer.id}`);}
const report={modules:modules.length,lessons:lessons.length,quotations,scriptures,links,summaries,quotedWords:words,sourceRecords:sources.length,matchedSourceChecks:audit.matchedChecks,prayerRules:prayers.length,generatedPrayerSteps:prayers.reduce((n,p)=>n+(p.steps?.length||0),0),issues};
console.log(JSON.stringify(report,null,2));if(issues.length)process.exitCode=1;
