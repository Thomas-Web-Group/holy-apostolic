'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(dist,file),'utf8'));
const data=read('content/saints-additions.json'),audit=read('content/saints-additions-audit.json'),base=read('content/saints.json'),oldBiographies=read('content/saints-biographies.json');
const sources=new Map([...base.sources,...oldBiographies.sources,...data.sources].map(source=>[source.id,source]));
const profiles=new Map(data.profiles.map(profile=>[profile.saintId,profile])),records=new Map(audit.blocks.map(block=>[block.saintId+'/'+block.scope,block]));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),norm=value=>value.normalize('NFKC').replace(/\s+/g,' ').trim();
assert.equal(data.saints.length,80);assert.equal(data.profiles.length,80);assert.equal(new Set(data.saints.map(saint=>saint.id)).size,80);
assert.equal(new Set([...base.saints,...data.saints].map(saint=>saint.id)).size,160);
for(const source of data.sources){assert.match(source.url,/^https:\/\//);assert.ok(source.title&&source.author&&source.edition&&source.type&&source.rights);}
for(const preserved of audit.preservedFiles){const file=fs.readFileSync(path.join(dist,preserved.path));assert.equal(hash(file),preserved.sha256,'Earlier source file changed: '+preserved.path);}
let quotes=0,summaries=0,words=0,events=0;
for(const saint of data.saints){
  assert.match(saint.id,/^[a-z0-9-]+$/);assert.ok(saint.name&&saint.sourceTitle&&saint.era&&saint.region&&saint.dates&&saint.context);assert.ok(Array.isArray(saint.aliases)&&saint.types.length);
  assert.ok(sources.has(saint.sourceId));assert.equal(saint.summary.kind,'summary');
  const commemoration=saint.commemoration;assert.ok(sources.has(commemoration.sourceId)&&commemoration.locator);
  if(!Number.isInteger(commemoration.day))assert.ok(commemoration.label,'Movable/unspecified commemoration requires published label');
  if(commemoration.month!==null&&commemoration.month!==undefined)assert.ok(Number.isInteger(commemoration.month)&&commemoration.month>=1&&commemoration.month<=12);
  if(Number.isInteger(commemoration.day))assert.ok(commemoration.day>=1&&commemoration.day<=31);
  const profile=profiles.get(saint.id);assert.ok(profile);assert.deepEqual(profile.sections.map(section=>section.id).sort(),['background','death','legacy','life']);
  assert.ok(['martyr','other-death','uncertain','mixed'].includes(profile.death.status)&&profile.death.label);assert.ok(profile.chronology.length);
  const blocks=[['introduction',saint.summary],...(saint.excerpt?[['excerpt',saint.excerpt]]:[]),...profile.sections.flatMap(section=>{assert.ok(section.blocks.length);return section.blocks.map((block,index)=>[section.id+'-'+index,block]);}),...profile.chronology.map((entry,index)=>{assert.ok(entry.date);events++;return ['chronology-'+index,entry.event];}),...(saint.readings||[]).map((reading,index)=>['reading-'+index,{...reading,kind:'quotation'}])];
  for(const [scope,block]of blocks){
    assert.ok(['quotation','summary'].includes(block.kind));assert.ok(block.text);words+=block.text.trim().split(/\s+/).length;
    const refs=block.sourceRefs||[{sourceId:block.sourceId,locator:block.locator}];assert.ok(refs.length);for(const ref of refs)assert.ok(sources.has(ref.sourceId)&&ref.locator);
    const record=records.get(saint.id+'/'+scope);assert.ok(record,'Missing audit: '+saint.id+'/'+scope);assert.equal(record.kind,block.kind);assert.equal(record.textSha256,hash(block.text));assert.deepEqual(record.sourceRefs,refs);
    if(block.kind==='summary'){summaries++;assert.ok(block.reason);assert.ok(record.reason===block.reason&&record.sourceEvidence?.length);}
    else{
      quotes++;assert.equal(record.verification.match,true);assert.ok(record.verification.sourceEvidence?.length);
      for(const evidence of record.verification.sourceEvidence)assert.match(evidence.sha256,/^[a-f0-9]{64}$/);
      if(block.edition==='kjv'){
        assert.equal(record.verification.edition,'kjv');assert.ok(record.verification.parts?.length);const parts=[];
        for(const part of record.verification.parts){assert.match(part.file,/^scripture\/kjv\/[a-z0-9-]+\.json$/i);const chapters=read(part.file).chapters;for(const address of part.addresses){const [chapter,verse]=address.split(':');assert.ok(chapters[chapter]?.[verse]);parts.push(chapters[chapter][verse]);}}
        if(record.verification.excerpt)assert.ok(norm(parts.join(' ')).includes(norm(block.text)));else assert.equal(norm(block.text),norm(parts.join(' ')));
      }
    }
  }
}
assert.equal(records.size,quotes+summaries);
console.log(JSON.stringify({additionalSaints:data.saints.length,totalSaints:base.saints.length+data.saints.length,biographySections:data.profiles.reduce((n,profile)=>n+profile.sections.length,0),chronologyEvents:events,sourceMatchedQuotations:quotes,necessarySummaries:summaries,readingWords:words,sources:data.sources.length,preservedSourceFiles:audit.preservedFiles.length,theologicalApproval:'not claimed',issues:[]},null,2));
