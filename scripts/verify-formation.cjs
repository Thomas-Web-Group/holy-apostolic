'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),content=path.join(root,'dist/content');
const read=name=>JSON.parse(fs.readFileSync(path.join(content,name),'utf8'));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const data=read('formation.json'),newData=read('further-curriculum.json'),glossary=read('glossary-supplement.json'),audit=read('formation-audit.json');
for(const [file,hash]of Object.entries(audit.dataHashes))assert.equal(digest(fs.readFileSync(path.join(content,file))),hash,'Data differs from reviewed source audit: '+file);
const old=['quoted-doctrine.json','quoted-worship.json','quoted-history-comparisons.json','expanded-curriculum.json'].map(read),lessons=[...old,newData].flatMap(d=>d.modules.flatMap(m=>m.lessons)),lessonIds=new Set(lessons.map(l=>l.id));
assert.equal(lessonIds.size,lessons.length,'Lesson IDs must be unique');
const sourceMap=new Map([...old,newData].flatMap(d=>d.sources).map(s=>[s.id,s]));
const coverageIds=new Set(data.coverage.map(r=>r.id));assert.equal(coverageIds.size,data.coverage.length);
for(const row of data.coverage){assert.ok(row.title&&row.domain&&['covered','partial','further-study'].includes(row.status));assert.ok(row.lessonIds.length);row.lessonIds.forEach(id=>assert.ok(lessonIds.has(id),'Unknown coverage lesson: '+id));row.prerequisites.forEach(id=>assert.ok(coverageIds.has(id)));if(row.status!=='covered')assert.ok(row.gap);}
function visit(id,ancestors=new Set()){assert.ok(!ancestors.has(id),'Cyclic prerequisites: '+id);const next=new Set(ancestors).add(id);data.coverage.find(r=>r.id===id).prerequisites.forEach(p=>visit(p,next));}
data.coverage.forEach(r=>visit(r.id));
let quotations=0,scriptures=0;
function quoted(record){assert.ok(record.text&&record.sourceId&&record.locator);assert.ok(sourceMap.has(record.sourceId));assert.ok(audit.quotations.some(a=>a.sourceId===record.sourceId&&a.locator===record.locator&&a.textHash===digest(record.text)&&a.matched),'Unmatched source quotation: '+record.locator);assert.ok(!record.text.includes('\ufffd'));quotations++;}
for(const module of newData.modules){assert.ok(module.id.startsWith('fc-'));for(const lesson of module.lessons){assert.ok(lesson.id.startsWith('fc-')&&lesson.readings.length);assert.ok(['introductory','intermediate','advanced'].includes(lesson.depth));assert.ok(lesson.stages.length&&lesson.revision);lesson.prerequisites.forEach(id=>assert.ok(lessonIds.has(id)));lesson.readings.forEach(r=>{assert.equal(r.kind,'quotation');quoted(r);});for(const s of lesson.scripture){quoted(s);scriptures++;}}}
for(const row of data.comparisons){assert.ok(row.scope&&row.category&&row.title);row.lessonIds.forEach(id=>assert.ok(lessonIds.has(id)));row.readings.forEach(quoted);}
const oldTerms=read('glossary.json').terms,termIds=new Set(oldTerms.map(t=>t.id)),termNames=new Set(oldTerms.map(t=>t.term.toLowerCase()));
for(const term of glossary.terms){assert.ok(!termIds.has(term.id),'Duplicate term ID');assert.ok(!termNames.has(term.term.toLowerCase()),'Duplicate term');termIds.add(term.id);termNames.add(term.term.toLowerCase());assert.equal(term.definition.kind,'summary');assert.ok(term.definition.reason&&term.definition.sourceId&&term.definition.locator&&term.definition.evidenceAnchor);assert.ok(sourceMap.has(term.definition.sourceId));term.lessonIds.forEach(id=>assert.ok(lessonIds.has(id)));}
assert.ok(data.reviewStatus.theologicalReview.includes('No external'));
console.log(JSON.stringify({newModules:newData.modules.length,newLessons:newData.modules.reduce((n,m)=>n+m.lessons.length,0),sourceCheckedBlocks:quotations,scriptureBlocks:scriptures,coverageTopics:data.coverage.length,comparisonTopics:data.comparisons.length,newGlossaryTerms:glossary.terms.length,prerequisiteGraph:'acyclic',issues:[]},null,2));
