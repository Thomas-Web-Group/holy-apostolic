'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist/content');
const history=JSON.parse(fs.readFileSync(path.join(root,'timeline.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(root,'timeline-reception.json'),'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(root,'reception-audit.json'),'utf8'));
const events=new Map(history.events.map(e=>[e.id,e])),sources=new Map([...history.sources,...data.sources].map(s=>[s.id,s]));
const proof=new Map(audit.annotations.map(a=>[a.eventId,a.sha256])),issues=[];
const check=(ok,message)=>{if(!ok)issues.push(message);};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const refs=(ids,where)=>{check(Array.isArray(ids)&&ids.length>0,'No source references: '+where);for(const id of ids||[])check(sources.has(id),'Unknown source '+id+': '+where);};
check(data.annotations.length===events.size,'Missing event classifications');
check(new Set(data.annotations.map(a=>a.eventId)).size===data.annotations.length,'Duplicate event classifications');
check(audit.issues.length===0,'Source-provenance audit contains issues');
for(const annotation of data.annotations){
 const id=annotation.eventId;check(events.has(id),'Unknown reception event: '+id);
 const hash=crypto.createHash('sha256').update(JSON.stringify(canonical(annotation))).digest('hex');
 check(hash===proof.get(id),'Changed reception annotation needs source review: '+id);
 check(['historical','doctrinal'].includes(annotation.kind),'Invalid reception classification: '+id);
 check(annotation.subject&&annotation.scope,'Missing comparison scope: '+id);
 check(annotation.provenance?.kind==='summary'&&annotation.provenance.reason,'Scope summary provenance missing: '+id);refs(annotation.provenance?.sourceIds,id);
 if(annotation.kind==='historical')check(annotation.positions.length===0,'Doctrinal agreement labels on historical event: '+id);
 else check(annotation.positions.length>=2,'Missing reception comparison: '+id);
 for(const position of annotation.positions){
  check(position.group&&position.label&&position.text,'Missing reception text: '+id);
  check(position.kind==='summary'&&position.reason,'Unlabelled reception summary: '+id);
  check(['affirmed','rejected','qualified','varies','not-established'].includes(position.status),'Invalid reception status: '+id);
  if(position.status!=='not-established'){check(position.locators?.length,'Missing reception locator: '+id+'/'+position.group);refs(position.sourceIds,id+'/'+position.group);}else if(position.sourceIds.length)refs(position.sourceIds,id+'/'+position.group);
 }
 for(const note of annotation.notes){check(note.kind==='summary'&&note.reason&&note.text,'Unlabelled comparison note: '+id);refs(note.sourceIds,id+'/note');}
}
for(const source of data.sources){for(const field of ['title','url','author','work','tradition','type','rights','rightsNote'])check(Boolean(source[field]),'Missing reception source '+field+': '+source.id);check(source.url.startsWith('https://'),'Invalid reception source URL: '+source.id);}
check(audit.evidence.length>0&&audit.evidence.every(e=>e.assessment==='not-established'||(e.files.length&&e.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256)))),'Retained-source evidence missing');
console.log(JSON.stringify({classifiedEvents:data.annotations.length,doctrinal:data.annotations.filter(a=>a.kind==='doctrinal').length,historical:data.annotations.filter(a=>a.kind==='historical').length,receptionPositions:data.annotations.reduce((n,a)=>n+a.positions.length,0),additionalSources:data.sources.length,issues},null,2));
if(issues.length)process.exitCode=1;
