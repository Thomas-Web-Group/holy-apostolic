'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'../dist'),read=p=>JSON.parse(fs.readFileSync(path.join(dist,p),'utf8')),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const reports=[];
for(const name of ['church-authority','church-interior']){
  const data=read('content/'+name+'.json'),audit=read('content/'+name+'-audit.json'),sources=new Map(data.sources.map(s=>[s.id,s])),records=new Map(audit.blocks.map(b=>[b.path,b]));let quotes=0,summaries=0,words=0,blocks=0;
  assert.equal(sources.size,data.sources.length);for(const s of sources.values()){assert.match(s.url,/^https:\/\//);assert.ok(s.title&&s.author&&s.edition&&s.rights);}
  function walk(value,at='$'){
    if(Array.isArray(value))return value.forEach((item,i)=>walk(item,at+'['+i+']'));
    if(!value||typeof value!=='object')return;
    if(['quotation','summary'].includes(value.kind)&&typeof value.text==='string'){
      blocks++;words+=value.text.trim().split(/\s+/).length;assert.ok(value.text&&value.sourceRefs?.length);const record=records.get(at);assert.ok(record,'Missing actual-source audit: '+at);assert.equal(record.kind,value.kind);assert.equal(record.textSha256,hash(value.text));assert.deepEqual(record.sourceRefs,value.sourceRefs);
      for(const ref of value.sourceRefs)assert.ok(sources.has(ref.sourceId)&&ref.locator,'Unresolved source: '+at);
      const proofs=value.kind==='quotation'?record.verification?.sourceEvidence:record.sourceEvidence;assert.ok(proofs?.length);for(const p of proofs)assert.match(p.sha256,/^[a-f0-9]{64}$/);
      if(value.kind==='quotation'){
        quotes++;assert.equal(record.verification.match,true);assert.ok(record.verification.method);
        if(value.edition==='kjv'){const verses=[];for(const p of record.verification.parts){const chapters=read(p.file).chapters;for(const address of p.addresses){const [chapter,verse]=address.split(':');assert.ok(chapters[chapter]?.[verse]);verses.push(chapters[chapter][verse]);}}const norm=v=>v.normalize('NFKC').replace(/\s+/g,' ').trim();assert.ok(norm(verses.join(' ')).includes(norm(value.text)));}
      }else{summaries++;assert.ok(value.reason&&value.reason===record.reason);assert.ok(proofs.some(p=>p.anchorMatched));}
    }
    for(const [key,item]of Object.entries(value))walk(item,at+'.'+key);
  }walk(data);assert.equal(blocks,records.size);
  if(name==='church-authority'){
    const ids=new Set(data.roles.map(r=>r.id));assert.equal(ids.size,data.roles.length);assert.ok(ids.has('bishop')&&ids.has('priest')&&ids.has('deacon'));assert.deepEqual(data.roles.filter(r=>r.category==='sacramental-orders').map(r=>r.id).sort(),['bishop','deacon','priest']);
    for(const r of data.relationships)assert.ok(ids.has(r.from)&&ids.has(r.to)&&r.type&&r.kind==='summary');for(const c of data.cases){assert.ok(c.id&&c.title&&c.jurisdiction&&c.date&&c.scope&&c.blocks.length);assert.ok(c.decisionMakerIds.every(id=>ids.has(id)));}
    reports.push({name,roles:ids.size,relationships:data.relationships.length,scopedPolicies:data.cases.length,quotes,summaries,words});
  }else{
    const ids=new Set(data.parts.map(p=>p.id));assert.equal(ids.size,data.parts.length);for(const p of data.parts){assert.ok(p.title&&p.area&&p.blocks.length);if(p.parentPartId)assert.ok(ids.has(p.parentPartId));}
    for(const collection of [data.steps,data.visitorSteps]){assert.equal(new Set(collection.map(s=>s.id)).size,collection.length);for(const s of collection)assert.ok(s.title&&s.performer&&s.blocks.length&&s.partIds.length&&s.partIds.every(id=>ids.has(id)));}
    assert.ok(data.layoutNotes.length>=3);assert.ok(data.steps.some(s=>s.simultaneousWith?.length));reports.push({name,parts:ids.size,liturgyMoments:data.steps.length,publishedVisitorCards:data.visitorSteps.length,quotes,summaries,words});
  }
}
const design=read('content/design-readings.json'),designAudit=read('content/design-readings-audit.json');assert.equal(design.readings.length,1);const verse=design.readings[0],proof=designAudit.blocks[0];assert.equal(verse.text,read('scripture/kjv/Ps.json').chapters['27']['4']);assert.equal(hash(verse.text),proof.textSha256);assert.equal(proof.verification.match,true);assert.equal(verse.numbering,'mt');
console.log(JSON.stringify({guides:reports,homeScripture:'Exact source-matched Psalm 27:4, KJV/Hebrew numbering',issues:[]},null,2));
