const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist/content');
const data=JSON.parse(fs.readFileSync(path.join(root,'timeline.json'),'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(root,'timeline-audit.json'),'utf8'));
const sourceMap=new Map(data.sources.map(s=>[s.id,s])),eventMap=new Map(data.events.map(e=>[e.id,e])),branchMap=new Map(data.branches.map(b=>[b.id,b]));
const proof=new Map(audit.checks.map(c=>[c.key,c]));
const issues=[];
function check(ok,text){if(!ok)issues.push(text);}
function refs(ids,where){check(Array.isArray(ids)&&ids.length>0,'No source references: '+where);for(const id of ids||[])check(sourceMap.has(id),'Unknown source '+id+': '+where);}
function quotation(item,key,id=item.sourceId){const known=proof.get(key),hash=crypto.createHash('sha256').update(item.text||'').digest('hex');check(known?.match&&known.textSHA256===hash&&known.sourceId===id&&known.locator===item.locator,'Unverified/modified quotation: '+key);}
check(data.events.length>=75,'Detailed chronology missing');
check(data.events.length===eventMap.size&&data.sources.length===sourceMap.size,'Duplicate event/source IDs');
check(audit.exactChecks===audit.matchedChecks&&audit.issues.length===0,'Source audit failed');
const councils=[325,381,431,451,553,680,787];for(const year of councils)check(data.events.some(e=>e.year===year&&e.type==='council'),'Council missing: '+year);
for(const event of data.events){
 check(Number.isInteger(event.year)&&event.year>=1&&event.year<=2100,'Invalid year: '+event.id);
 check(['shared','orthodox','western','protestant'].includes(event.lane),'Invalid lane: '+event.id);
 check(event.overview?.kind==='summary'&&event.overview.text&&event.overview.reason,'Overview provenance missing: '+event.id);refs(event.overview?.sourceIds,event.id);
 check(event.readings?.length>0,'No source reading: '+event.id);
 event.readings.forEach((item,index)=>{refs([item.sourceId],event.id);check(['quotation','link','summary'].includes(item.kind),'Reading type: '+event.id);if(item.kind==='quotation')quotation(item,event.id+'/reading/'+index);if(item.kind==='summary')check(item.reason,'Summary necessity: '+event.id);if(item.kind==='link')check(!item.text,'Unlabelled linked text: '+event.id);});
 for(const item of event.developments||[]){check(item.kind==='summary'&&item.reason,'Development provenance: '+event.id);refs(item.sourceIds,event.id);}
 for(const id of event.relatedEventIds||[])check(eventMap.has(id),'Unknown related event: '+id);
 for(const id of event.lessonIds||[])check(data.lessonTitles[id],'Unknown curriculum lesson: '+id);
}
for(const source of data.sources){for(const field of ['title','url','author','work','tradition','type','rights','rightsNote'])check(Boolean(source[field]),'Source '+field+': '+source.id);try{check(new URL(source.url).protocol==='https:','Source must use HTTPS: '+source.id);}catch{issues.push('Invalid URL: '+source.id);}}
check(data.branches.length===branchMap.size,'Duplicate branch nodes');
for(const branch of data.branches){refs(branch.sourceIds,branch.id);if(branch.eventId)check(eventMap.has(branch.eventId),'Unknown branch event: '+branch.id);}
for(const edge of data.connections){check(branchMap.has(edge.from)&&branchMap.has(edge.to),'Unknown connection node: '+edge.id);check(['continuity','emergence','separation','influence'].includes(edge.kind),'Unknown relationship: '+edge.id);check(edge.summary?.kind==='summary'&&edge.summary.reason,'Relationship provenance: '+edge.id);refs(edge.sourceIds,edge.id);}
check(data.book?.verifiedCoverage&&data.book.notes?.length>0,'Book-source coverage missing');
for(const note of data.book.notes){refs(note.sourceIds||[note.sourceId],note.id);check(['book-excerpt','author-talk','publisher-description'].includes(note.sourceType),'Author source scope: '+note.id);if(note.kind==='quotation')quotation(note,'book/'+note.id,note.sourceId||note.sourceIds[0]);else check(note.kind==='summary'&&note.reason,'Author-summary provenance: '+note.id);for(const id of note.eventIds||[])check(eventMap.has(id),'Unknown author-note event: '+id);}
const result={events:data.events.length,keyEvents:data.events.filter(e=>e.key).length,sourceRecords:data.sources.length,branches:data.branches.length,connections:data.connections.length,bookNotes:data.book.notes.length,verifiedQuotations:audit.matchedChecks,issues};console.log(JSON.stringify(result,null,2));if(issues.length)process.exitCode=1;
