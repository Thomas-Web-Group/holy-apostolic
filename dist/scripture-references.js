'use strict';
(function(factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.ScriptureReferences=api;
})(function(){
  // Chapter/verse numbers are the source's numbers. This module never converts
  // Psalm, Coverdale, Septuagint, or Hebrew versification.
  const books=[
    ['Gen',50,['Genesis','Gen','Ge']],['Exod',40,['Exodus','Exod','Ex']],['Lev',27,['Leviticus','Levit','Lev']],
    ['Num',36,['Numbers','Number','Num','Numb']],['Deut',34,['Deuteronomy','Deut','Dt']],['Josh',24,['Joshua','Josue','Josh']],
    ['Judg',21,['Judges','Judg','Jdg']],['Ruth',4,['Ruth']],
    ['1Sam',31,['1 Samuel','1 Sam','1 Sa']],['2Sam',24,['2 Samuel','2 Sam','2 Sa']],
    ['1Kgs',22,['1 Kings','1 Kgs','1 Ki']],['2Kgs',25,['2 Kings','2 Kgs','2 Ki']],
    ['1Chr',29,['1 Chronicles','1 Chronicle','1 Chron','1 Chr','1 Paralipomenon','1 Paralipomena']],
    ['2Chr',36,['2 Chronicles','2 Chronicle','2 Chron','2 Chr','2 Paralipomenon','2 Paralipomena']],
    ['Ezra',10,['Ezra']],['Neh',13,['Nehemiah','Nehem','Neh']],['Esth',10,['Esther','Esth','Est']],
    ['Job',42,['Job']],['Ps',151,['Psalms','Psalm','Psal','Ps','Psa','Psalter']],['Prov',31,['Proverbs','Proverb','Prov']],
    ['Eccl',12,['Ecclesiastes','Eccles','Eccl','Qoheleth']],['Song',8,['Song of Solomon','Song of Songs','Canticle of Canticles','Canticles','Canticle','Cant','Song']],
    ['Isa',66,['Isaiah','Isaias','Isa','Is']],['Jer',52,['Jeremiah','Jeremias','Jer']],['Lam',5,['Lamentations','Lamentation','Lament','Lam']],
    ['Ezek',48,['Ezekiel','Ezechiel','Ezek','Ezech']],['Dan',14,['Daniel','Dan']],['Hos',14,['Hosea','Osee','Hos']],
    ['Joel',4,['Joel']],['Amos',9,['Amos']],['Obad',1,['Obadiah','Abdias','Obad']],['Jonah',4,['Jonah','Jonas','Jon']],
    ['Mic',7,['Micah','Micheas','Mic']],['Nah',3,['Nahum','Nah']],['Hab',3,['Habakkuk','Habacuc','Hab']],
    ['Zeph',3,['Zephaniah','Sophonias','Zeph']],['Hag',2,['Haggai','Aggeus','Hag']],['Zech',14,['Zechariah','Zacharias','Zech','Zach']],
    ['Mal',4,['Malachi','Malachias','Mal']],
    ['Matt',28,['Matthew','Matthaeus','Matt','Mat','Mt']],['Mark',16,['Mark','Marcus','Mk']],
    ['Luke',24,['Luke','Lucas','Lk']],['John',21,['John','Joannes','Joann','Joh','Jn']],['Acts',28,['Acts of the Apostles','Acts','Act']],
    ['Rom',16,['Romans','Rom']],['1Cor',16,['1 Corinthians','1 Corinth','1 Cor']],['2Cor',13,['2 Corinthians','2 Corinth','2 Cor']],
    ['Gal',6,['Galatians','Gal']],['Eph',6,['Ephesians','Eph']],['Phil',4,['Philippians','Philip','Phil']],['Col',4,['Colossians','Col']],
    ['1Thess',5,['1 Thessalonians','1 Thessalon','1 Thess','1 Thes']],['2Thess',3,['2 Thessalonians','2 Thessalon','2 Thess','2 Thes']],
    ['1Tim',6,['1 Timothy','1 Tim']],['2Tim',4,['2 Timothy','2 Tim']],['Titus',3,['Titus','Tit']],['Phlm',1,['Philemon','Philem','Phlm']],
    ['Heb',13,['Hebrews','Heb']],['Jas',5,['James','Jas','Jam']],['1Pet',5,['1 Peter','1 Pet','1 Petr']],['2Pet',3,['2 Peter','2 Pet','2 Petr']],
    ['1John',5,['1 John','1 Joh','1 Jn']],['2John',1,['2 John','2 Joh','2 Jn']],['3John',1,['3 John','3 Joh','3 Jn']],
    ['Jude',1,['Jude','Judas']],['Rev',22,['Revelation','Revelations','Apocalypse','Apoc','Rev']],
    ['Tob',14,['Tobit','Tobias','Tob']],['Jdt',16,['Judith','Jdt']],['Wis',19,['Wisdom of Solomon','Wisdom','Wisd','Wis']],
    ['Sir',51,['Wisdom of Sirach','Ecclesiasticus','Sirach','Sir','Ecclus']],['Bar',6,['Baruch','Bar']],
    ['EpJer',1,['Epistle of Jeremiah','Letter of Jeremiah','Ep Jer']],
    ['1Macc',16,['1 Maccabees','1 Machabees','1 Macc','1 Mac']],['2Macc',15,['2 Maccabees','2 Machabees','2 Macc','2 Mac']],
    ['3Macc',7,['3 Maccabees','3 Machabees','3 Macc','3 Mac']],['4Macc',18,['4 Maccabees','4 Machabees','4 Macc','4 Mac']],
    ['1Esd',9,['1 Esdras','1 Esd']],['2Esd',16,['2 Esdras','2 Esd']],['PrMan',1,['Prayer of Manasseh','Prayer of Manasses','Pr Man']],
    ['PrAzar',1,['Prayer of Azariah','Prayer of Azarias','Song of the Three Children','Song of Three Children','Song of the Three Holy Children']],
    ['Sus',1,['Susanna','Sus']],['Bel',1,['Bel and the Dragon','Bel and Dragon']],
    ['EsthGr',16,['Greek Esther','Greek Esth']],['DanGr',14,['Greek Daniel','Greek Dan']],
    ['AddEsth',16,['Additions to Esther','Additions of Esther','Rest of Esther','Rest of Esth','Esther Additions']]
  ];
  const numberWords={1:['1','I','First','1st'],2:['2','II','Second','2nd'],3:['3','III','Third','3rd'],4:['4','IV','Fourth','4th']};
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const key=value=>String(value).toLowerCase().replace(/[\s.\-]/g,'');
  const aliases=[];
  for(const [book,maxChapters,names]of books){
    for(const name of [...names,book]){
      const numbered=/^([1-4])\s*(.+)$/.exec(name);
      if(numbered){for(const prefix of numberWords[numbered[1]])aliases.push({name:prefix+' '+numbered[2],book,maxChapters});}
      else aliases.push({name,book,maxChapters});
    }
  }
  // Older Greek naming calls Samuel 1/2 Kingdoms and Kings 3/4 Kingdoms.
  for(const [n,book]of [[1,'1Sam'],[2,'2Sam'],[3,'1Kgs'],[4,'2Kgs']])for(const prefix of numberWords[n]){
    aliases.push({name:prefix+' Kingdoms',book,bookNaming:'greek',maxChapters:books.find(b=>b[0]===book)[1]});
    if(n>2)aliases.push({name:prefix+' Kings',book,bookNaming:'greek',maxChapters:books.find(b=>b[0]===book)[1]});
  }
  for(const [name,bookCandidates,maxChapters]of [
    ['Pet',['1Pet','2Pet'],5],['Peter',['1Pet','2Pet'],5],['Cor',['1Cor','2Cor'],16],['Corinthians',['1Cor','2Cor'],16],
    ['Thess',['1Thess','2Thess'],5],['Thessalonians',['1Thess','2Thess'],5],['Tim',['1Tim','2Tim'],6],['Timothy',['1Tim','2Tim'],6],
    ['Samuel',['1Sam','2Sam'],31],['Chronicles',['1Chr','2Chr'],36],['Kings',['1Kgs','2Kgs','1Sam','2Sam'],31],['Esdras',['Ezra','1Esd','2Esd'],16]
  ])aliases.push({name,book:bookCandidates[0],bookCandidates,maxChapters});
  const lookup=new Map(),aliasCandidates=new Map();for(const alias of aliases){const normalized=key(alias.name);if(!lookup.has(normalized))lookup.set(normalized,alias);if(!aliasCandidates.has(normalized))aliasCandidates.set(normalized,[]);aliasCandidates.get(normalized).push(alias);}
  function namePattern(name){return name.split(/\s+/).map(escape).join('\\s*\\.?\\s*');}
  const names=[...lookup.values()].sort((a,b)=>b.name.length-a.name.length);
  const bookPattern=names.map(a=>namePattern(a.name)).join('|');
  const pairedKings='[12]\\s*\\(\\s*[34](?:\\s+in\\s+the\\s+Greek)?\\s*\\)\\s*Kings';
  const searchPattern='(?<![\\p{L}\\p{N}_])(?:St\\.?\\s*|Saint\\s+)?('+pairedKings+'|'+bookPattern+')(?![\\p{L}_])';
  const punctuation=/[\s\u00a0]/;
  const rangeMark=/[-–—−]/;
  function roman(value){
    const token=value.toUpperCase();if(!token||!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(token))return null;
    const values={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0;
    for(let i=0;i<token.length;i++)total+=(values[token[i]]<values[token[i+1]]?-1:1)*values[token[i]];
    return total||null;
  }
  function spaces(text,index){while(index<text.length&&punctuation.test(text[index]))index++;return index;}
  function numeral(text,index){
    const match=/^(\d{1,4}|[ivxlcdm]{1,15})(?![\p{L}\p{N}_])/iu.exec(text.slice(index));if(!match)return null;
    const value=/^\d/.test(match[1])?Number(match[1]):roman(match[1]);
    if(!value||value>3999)return null;return {value,end:index+match[1].length,roman:!/^\d/.test(match[1]),raw:match[1]};
  }
  function verse(text,index){
    // Verse suffixes a/b refer to a segment. The caller can display the full
    // verse and explain that the source cited only a segment.
    const match=/^(\d{1,4})([a-d])?(?=$|[^\p{L}\p{N}_]|f{1,2}\.?(?![\p{L}\p{N}_]))/iu.exec(text.slice(index));
    if(match&&Number(match[1])>0)return {value:Number(match[1]),suffix:match[2]?.toLowerCase(),end:index+match[0].length,roman:false};
    return numeral(text,index);
  }
  function separatorAfter(text,number,{initial=false,commaVerse=false}={}){
    let index=spaces(text,number.end),separator=text[index];
    if(separator===':')return {index:spaces(text,index+1),explicit:true};
    if(separator==='.')return {index:spaces(text,index+1),explicit:true};
    if(separator===','&&(number.roman||commaVerse))return {index:spaces(text,index+1),explicit:true};
    // "John iii 16" is recognizably a legacy chapter/verse citation.
    if(initial&&number.roman&&index>number.end&&/^\d/.test(text[index]||''))return {index,explicit:false};
    return null;
  }
  function initialPart(text,index,context={}){
    index=spaces(text,index);if(text[index]==='.')index=spaces(text,index+1);
    const marker=/^(?:chapters?|chap\.?|ch\.?)\s*/i.exec(text.slice(index));if(marker)index+=marker[0].length;
    const chapter=numeral(text,index);if(!chapter)return null;
    let part={chapter:chapter.value},end=chapter.end;
    const sep=separatorAfter(text,chapter,{initial:true,commaVerse:context.commaVerse===true});
    if(sep){const v=verse(text,sep.index);if(v){part.startVerse=v.value;if(v.suffix)part.startSuffix=v.suffix;end=v.end;}}
    if(!part.startVerse&&chapter.roman&&!marker){
      const next=spaces(text,chapter.end);
      // Avoid reading "John I believe..." as a chapter citation.
      if(next>chapter.end&&/^[\p{L}]/u.test(text[next]||''))return null;
    }
    const range=finishRange(text,part,end,context);return {...range,chapterRoman:chapter.roman,explicitChapter:!!marker};
  }
  function finishRange(text,part,end,context={}){
    let index=spaces(text,end);
    if(rangeMark.test(text[index]||'')){
      const right=verse(text,spaces(text,index+1));
      if(right){
        const sep=separatorAfter(text,right,{commaVerse:context.commaVerse===true});
        const last=part.startVerse&&sep?verse(text,sep.index):null;
        if(last){part.endChapter=right.value;part.endVerse=last.value;if(last.suffix)part.endSuffix=last.suffix;end=last.end;}
        else if(part.startVerse){part.endVerse=right.value;if(right.suffix)part.endSuffix=right.suffix;end=right.end;}
        else{part.endChapter=right.value;end=right.end;}
      }
    }
    index=spaces(text,end);
    const following=/^(?:f{1,2}\.?|(?:,\s*)?(?:&c\.?|etc\.?))(?![\p{L}\p{N}_])/iu.exec(text.slice(index));
    if(following){part.following=true;end=index+following[0].length;}
    return {part,end};
  }
  function continuation(text,start,previous,context={}){
    let index=spaces(text,start),delimiter=text[index];
    if(![',',';'].includes(delimiter)){
      const and=/^(?:and|&)\s+/i.exec(text.slice(index));if(!and)return null;delimiter='and';index+=and[0].length;
    }else index=spaces(text,index+1);
    const conjunction=/^(?:and|&)\s+/i.exec(text.slice(index));if(conjunction)index+=conjunction[0].length;
    if(/\n\s*\n/.test(text.slice(start,index)))return null;
    const number=numeral(text,index)||verse(text,index);if(!number)return null;
    const sep=separatorAfter(text,number,{commaVerse:context.commaVerse===true});
    let part,end=number.end;
    const explicitVerse=sep?verse(text,sep.index):null;
    if(explicitVerse){part={chapter:number.value,startVerse:explicitVerse.value};if(explicitVerse.suffix)part.startSuffix=explicitVerse.suffix;end=explicitVerse.end;}
    else if(previous.startVerse&&delimiter!==';'&&!number.roman){part={chapter:previous.endChapter||previous.chapter,startVerse:number.value};if(number.suffix)part.startSuffix=number.suffix;}
    else part={chapter:number.value};
    return finishRange(text,part,end,context);
  }
  function resolveAlias(raw,context){
    const paired=/^([12])\s*\(\s*([34])(?:\s+in\s+the\s+Greek)?\s*\)\s*Kings$/i.exec(raw);
    if(paired)return {book:paired[1]==='1'?'1Kgs':'2Kgs',maxChapters:paired[1]==='1'?22:25,pairedNaming:{hebrew:Number(paired[1]),greek:Number(paired[2]),family:'Kings'},bookNaming:'paired'};
    let alias=lookup.get(key(raw));if(!alias)return null;
    // "Isa" (Isaiah) is not the same token as "I Sa" (1 Samuel).
    // Only collapse optional spacing after choosing the unnumbered compact
    // alias where such a collision exists.
    if(!/[\s.]/.test(raw)){const compact=(aliasCandidates.get(key(raw))||[]).find(a=>!/[\s.]/.test(a.name));if(compact)alias=compact;}
    alias={...alias};
    const override=context.bookOverrides?.[raw]||context.bookOverrides?.[key(raw)];if(override){alias.book=override;delete alias.bookCandidates;}
    if(context.bookNaming==='greek'&&!alias.bookNaming){if(alias.book==='1Kgs')alias.book='1Sam';else if(alias.book==='2Kgs')alias.book='2Sam';}
    alias.maxChapters=books.find(b=>b[0]===alias.book)?.[1]||alias.maxChapters;
    return alias;
  }
  function find(text,context={}){
    text=String(text??'');const results=[],matcher=new RegExp(searchPattern,'giu');let match;
    while((match=matcher.exec(text))){
      const alias=resolveAlias(match[1],context);if(!alias)continue;
      const preceding=text.slice(Math.max(0,match.index-24),match.index);
      if(/(?:Pope|Patriarch|King|Emperor)\s*$/i.test(preceding))continue;
      let first;
      if(alias.maxChapters===1){
        const marker=/^\.?\s*(?:verses?|vv?\.|ver\.)\s*/i.exec(text.slice(matcher.lastIndex));
        if(marker){const v=verse(text,matcher.lastIndex+marker[0].length);if(v){const part={chapter:1,startVerse:v.value};if(v.suffix)part.startSuffix=v.suffix;first=finishRange(text,part,v.end,context);first.singleChapterShorthand=true;}}
      }
      if(!first)first=initialPart(text,matcher.lastIndex,context);if(!first)continue;
      if(alias.maxChapters===1&&!first.part.startVerse&&first.part.chapter>200)continue;
      if(alias.maxChapters===1&&!first.part.startVerse&&first.part.chapter>1){const number=first.part.chapter;first.part.chapter=1;first.part.startVerse=number;if(first.part.endChapter){first.part.endVerse=first.part.endChapter;delete first.part.endChapter;}first.singleChapterShorthand=true;}
      if(!first.part.startVerse&&first.part.chapter>alias.maxChapters)continue;
      let end=first.end;const parts=[first.part];
      for(let count=0;count<50;count++){
        const next=continuation(text,end,parts[parts.length-1],context);if(!next||next.end<=end)break;
        if(!next.part.startVerse&&next.part.chapter>alias.maxChapters)break;
        parts.push(next.part);end=next.end;
      }
      // A trailing explicit numbering or edition marker belongs to this
      // reference, rather than being inferred from the author's identity.
      const after=/^\s*\((LXX|Septuagint|MT|Hebrew|KJV|AV|Brenton|BCP|Coverdale)\)/i.exec(text.slice(end));
      let numbering=context.numbering||context.psalmNumbering||'unspecified',editionHint=context.editionHint||context.edition;
      if(after){const marker=after[1].toLowerCase();if(['lxx','septuagint'].includes(marker)){numbering='lxx';editionHint='brenton';}else if(['mt','hebrew'].includes(marker))numbering='mt';else editionHint=marker==='av'?'kjv':marker;end+=after[0].length;}
      if(alias.bookNaming==='greek'&&!editionHint)editionHint='brenton';
      const result={start:match.index,end,text:text.slice(match.index,end),book:alias.book,parts,numbering};
      if(editionHint)result.editionHint=editionHint;
      if(alias.bookNaming)result.bookNaming=alias.bookNaming;
      if(alias.pairedNaming)result.pairedNaming=alias.pairedNaming;
      if(first.singleChapterShorthand)result.singleChapterShorthand=true;
      if(alias.bookCandidates){result.bookCandidates=alias.bookCandidates;result.ambiguousReason='The source does not specify which numbered '+match[1].replace(/\.$/,'')+' book is intended.';}
      if(alias.maxChapters===1&&parts.length===1&&!parts[0].startVerse&&!first.explicitChapter){result.singleChapterAmbiguity=true;result.ambiguousReason='This book has one chapter; a bare 1 can refer to the whole chapter or to verse 1.';}
      if(parts.some(part=>part.following)){result.following=true;result.ambiguousReason=[result.ambiguousReason,'The source says following verses without specifying an endpoint.'].filter(Boolean).join(' ');}
      if(parts.some(part=>part.startSuffix||part.endSuffix))result.partialVerse=true;
      results.push(result);matcher.lastIndex=end;
    }
    if(context.book&&context.chapter){
      const verseMatcher=/(?<![\p{L}\p{N}_])(?:verses?|vv?\.)\s*(\d{1,4})([a-d])?(?:\s*[-–—−]\s*(\d{1,4})([a-d])?)?(?![\p{L}\p{N}_])/giu;let v;
      while((v=verseMatcher.exec(text))){const end=v.index+v[0].length;if(results.some(r=>v.index<r.end&&end>r.start))continue;const part={chapter:Number(context.chapter),startVerse:Number(v[1])};if(v[3])part.endVerse=Number(v[3]);if(v[2])part.startSuffix=v[2].toLowerCase();if(v[4])part.endSuffix=v[4].toLowerCase();results.push({start:v.index,end,text:v[0],book:context.book,parts:[part],numbering:context.numbering||context.psalmNumbering||'unspecified',explicitContext:true,...(context.editionHint?{editionHint:context.editionHint}:{})});}
    }
    return results.sort((a,b)=>a.start-b.start);
  }
  return {find,roman,books:books.map(([book,maxChapters,names])=>({book,maxChapters,names})),version:'1.0.1'};
});
