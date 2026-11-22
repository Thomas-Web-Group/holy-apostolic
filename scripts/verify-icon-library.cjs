'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const library=read('content/icon-library.json'),images=read('content/icon-images.json').images,audit=read('content/icon-library-audit.json');
const sources=new Map(library.sources.map(source=>[source.id,source])),records=new Map(audit.blocks.map(block=>[block.iconId+'/'+block.scope,block]));
const hash=text=>crypto.createHash('sha256').update(text).digest('hex'),norm=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim();
const books=new Map(Object.values(read('scripture/manifest.json').editions.kjv.books).map(book=>[book.name.toLowerCase(),book]));
assert.equal(library.profiles.length,130);assert.equal(new Set(library.profiles.map(profile=>profile.id)).size,130);
assert.equal(images.length,130);assert.deepEqual(images.map(image=>image.iconId).sort(),library.profiles.map(profile=>profile.id).sort());
let quotations=0,kjvQuotations=0,summaries=0,words=0;
for(const source of sources.values()){assert.match(source.url,/^https:\/\//);assert.ok(source.title&&source.author&&source.type&&source.rights);}
for(const profile of library.profiles){
  assert.match(profile.id,/^[a-z0-9-]+$/);assert.ok(profile.title&&Array.isArray(profile.aliases));assert.ok(['Christ','Theotokos','Feasts','Scriptural scenes','Saints'].includes(profile.subject));
  assert.deepEqual(profile.sections.map(section=>section.id).sort(),['depiction','history','meaning']);
  const blocks=[['overview',profile.overview],...profile.sections.flatMap(section=>section.blocks.map((block,index)=>[section.id+'-'+index,block]))];
  for(const [scope,block]of blocks){
    assert.ok(['quotation','summary'].includes(block.kind));assert.ok(block.text);words+=block.text.trim().split(/\s+/).length;
    assert.ok(block.sourceRefs?.length);for(const ref of block.sourceRefs)assert.ok(sources.has(ref.sourceId)&&ref.locator);
    const evidence=records.get(profile.id+'/'+scope);assert.ok(evidence);assert.equal(evidence.kind,block.kind);assert.equal(evidence.textSha256,hash(block.text));assert.deepEqual(evidence.sourceRefs,block.sourceRefs);
    if(block.kind==='quotation'){
      quotations++;assert.equal(evidence.verification.match,true);
      if(evidence.verification.sourceEvidence){
        assert.ok(evidence.verification.sourceEvidence.length);for(const proof of evidence.verification.sourceEvidence)assert.match(proof.sha256,/^[a-f0-9]{64}$/);
        if(block.edition==='kjv'){
          kjvQuotations++;assert.equal(evidence.verification.edition,'kjv');assert.ok(evidence.verification.parts.length);const expected=[];
          for(const part of evidence.verification.parts){assert.match(part.file,/^scripture\/kjv\/[a-z0-9-]+\.json$/i);const chapters=read(part.file).chapters;for(const address of part.addresses){const [chapter,verse]=address.split(':');assert.ok(chapters[chapter]?.[verse]);expected.push(chapters[chapter][verse]);}}
          if(evidence.verification.excerpt)assert.ok(norm(expected.join(' ')).includes(norm(block.text)));else assert.equal(norm(block.text),norm(expected.join(' ')));
        }else assert.ok(block.sourceRefs.every(ref=>/public.domain|cc by|creative commons/i.test(sources.get(ref.sourceId).rights)),'Historical quotation requires a reuse basis');
      }else{
        // The original 50 entries retain their independent, exact verse-range checks.
        kjvQuotations++;assert.equal(block.edition,'kjv');const match=block.sourceRefs[0].locator.match(/^(.+?)\s+(\d+):(\d+)(?:[–-](\d+))?$/);assert.ok(match);
        const book=books.get(match[1].toLowerCase());assert.ok(book);const verses=read('scripture/'+book.file).chapters[match[2]],expected=[];
        for(let verse=Number(match[3]);verse<=Number(match[4]||match[3]);verse++){assert.ok(verses[verse]);expected.push(verses[verse]);}assert.equal(norm(block.text),norm(expected.join(' ')));
      }
    }else{summaries++;assert.ok(block.reason&&evidence.reason===block.reason&&evidence.researchAudit);}
  }
  assert.ok(profile.scripture.every(ref=>ref.edition==='kjv'&&ref.reference));
}
for(const image of images){
  assert.match(image.path,/^assets\/(?:icons|saints)\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/);assert.ok(image.author&&image.title&&image.identityEvidence&&image.alt);
  assert.match(image.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.match(image.licenseUrl,/^https:\/\/(?:commons\.wikimedia\.org|creativecommons\.org|artlibre\.org)\//);assert.match(image.license,/^(?:Public domain|CC0|CC BY(?:-SA)? [1-4]\.0|Free Art License|FAL)/);
  const file=fs.readFileSync(path.join(root,image.path));assert.equal(hash(file),image.sha256);assert.equal(file.length,image.bytes);assert.ok(image.width>0&&image.height>0);
}
assert.equal(records.size,quotations+summaries);for(const total of Object.values(audit.derivedWordsByPublication))assert.ok(total<=200);
const anapeson=library.profiles.find(profile=>profile.id==='christ-anapeson');assert.ok(anapeson.sections.some(section=>section.blocks.some(block=>/Unsleeping Eye/.test(block.text))));
const iveron=images.find(image=>image.iconId==='theotokos-iveron');assert.match(iveron.author,/traditional attribution/i);
console.log(JSON.stringify({icons:library.profiles.length,images:images.length,sources:sources.size,sourceMatchedQuotations:quotations,exactKJVQuotations:kjvQuotations,necessarySourceSummaries:summaries,readingWords:words,modernSourceBudgets:'checked separately by underlying publication',theologicalApproval:'not claimed',issues:[]},null,2));
