'use strict';
// Honorifics are a presentation layer; exact quotations and saved offsets stay intact.
window.OrthodoxSaintReferences=(()=>{
 const data=window.OrthodoxSaintData,identities=data.identities;
 const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const word='[\\p{L}\\p{N}_]',patternFor=aliases=>aliases.length?new RegExp('(?<!'+word+')(?:'+aliases.sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?!'+word+')','gu'):null;
 const titledAliases=Object.keys(data.titled),globalPattern=patternFor([...new Set([...Object.keys(data.full),...titledAliases])]);
 const excluded='script,style,button,input,textarea,select,option,code,pre,svg,[contenteditable]:not([contenteditable="false"]),[data-saint-skip],.saint-reference,.scripture-reference,.scripture-assist,.scripture-preview,.glossary-preview,.glossary-reference,.note-preview,.notebook-item,.journal-card,.study-tools-page,.artwork-source,.image-credit,.image-provenance,.required-attribution,.reading-locator';
 const verbatim='blockquote,.native-prayer-text,.scripture,.original-reading,.published-prayer,[data-scripture-verse],.publication-title,.publication-details,.reading-attribution,.saint-excerpt-label,.saint-reading-context,.source-context,.tl-sources,.image-provenance';
 const labels='h1,h2,h3,h4,p,li,dd,dt,summary,figcaption,.card-meta,.saint-timeline-name';
 const contexts=new Map(),queue=new Set();let timer,observer;
 const canonicalText=node=>{const copy=node.cloneNode(true);for(const span of copy.querySelectorAll?.('[data-saint-honorific]')||[])span.remove();return copy.textContent||'';};
 const displayName=id=>identities[id]?.display||'';
 function keyFor(element,route){const match=route.match(/^#?\/lesson\/([^/?]+)/);if(!match)return '';const scope=element.closest('[data-study-scope]')?.getAttribute('data-study-scope')||'';let part=scope.match(/^lesson-introduction-(\d+)$/);if(part)return match[1]+'/overview/'+part[1];part=scope.match(/^lesson-explanation-(\d+)-(\d+)$/);return part?match[1]+'/readings/'+(Number(part[1])+1)+'/'+part[2]:'';}
 function contextFor(element,route){
  const key=keyFor(element,route),exact=data.paragraphs[key],aliases={...exact},protectedText=Boolean(element.closest(verbatim));
  // A reviewed paragraph overrides a source-author shortcut. Quotations do not inherit their author's first name.
  if(!exact&&!protectedText){if(element.matches('h1,h2,h3,h4,a'))Object.assign(aliases,data.lessons?.[route.match(/^#?\/lesson\/([^/?]+)/)?.[1]]||{});const source=element.closest('[data-scripture-source]')?.getAttribute('data-scripture-source');Object.assign(aliases,data.sources[source]||{});}
  for(const [selector,map]of Object.entries(data.scoped))if(element.closest(selector))Object.assign(aliases,map);
  const cacheKey=JSON.stringify(aliases);let pattern=contexts.get(cacheKey);if(!pattern){pattern=patternFor([...new Set([...Object.keys(data.full),...titledAliases,...Object.keys(aliases)])]);contexts.set(cacheKey,pattern);}return {aliases,pattern:pattern||globalPattern,protectedText,key};
 }
 function resolve(alias,before,after,ctx){
  if((data.exclusions[ctx.key]||[]).includes(alias))return null;
  // Bible references and titles of Christ must retain their own meaning.
  if(/^\s*\d/u.test(after)||/\b(?:new|second|last)\s+$/iu.test(before)&&alias==='Adam')return null;
  if(/\b(?:King\s+)$/u.test(before)&&alias==='James'||/\b(?:John|Martin)\b/u.test(alias)&&/^\s+(?:Piper|Calvin|Luther)\b/u.test(after))return null;
  const explicitTitle=/(?:\bSaints?\s+|\bSts?\.\s+)$/u.test(before)||alias==='Gabriel'&&/\bArchangel\s+$/u.test(before);
  let id=ctx.aliases[alias]||data.full[alias];
  if(!id&&explicitTitle&&data.titled[alias]?.length===1)id=data.titled[alias][0];
  // A short author name must not consume a different person's surname or a regnal number.
  if(id&&!alias.includes(' ')&&/^\s+(?:[IVX]+\b|(?:Piper|Calvin|Luther|Voznesensky|Zebedee|Brianchaninov|of\s+Sebaste|the\s+Elder)\b)/u.test(after))return null;
  return id&&identities[id]?{id,explicitTitle}:null;
 }
 function honorific(parent,id,name){let prefix=identities[id].prefix;if(prefix==='Sts. '&&!/\band\b/u.test(name))prefix='St. ';if(id==='gabriel-archangel'&&!/Archangel/u.test(name))prefix='Archangel ';if(!prefix)return;const span=document.createElement('span');span.dataset.saintHonorific='true';span.textContent=prefix;parent.append(span);}
 function qualifyLink(anchor,id){
  if(!identities[id])return;anchor.classList.add('saint-reference');anchor.dataset.saintId=id;anchor.setAttribute('title',identities[id].display);
  if(anchor.closest(verbatim)||anchor.querySelector('[data-saint-honorific]')||/^(?:Saints?|Sts?\.)\s/u.test(anchor.textContent.trim())||!identities[id].prefix)return;
  const inner=anchor.querySelector('h2,h3');if(inner&&inner.textContent.trim()===identities[id].name){const span=document.createElement('span');span.dataset.saintHonorific='true';span.textContent=identities[id].prefix;inner.prepend(span);return;}
  const text=anchor.textContent.trim();if(!text||!([identities[id].name,identities[id].name.split(/[ ,]/)[0],...Object.keys(data.full).filter(alias=>data.full[alias]===id)].includes(text)))return;
  const span=document.createElement('span');span.dataset.saintHonorific='true';span.textContent=identities[id].prefix==='Sts. '&&!/\band\b/u.test(text)?'St. ':identities[id].prefix;anchor.prepend(span);
 }
 function qualifyNavigation(anchor,route){
  if(anchor.closest(excluded)||anchor.closest(verbatim)||anchor.querySelector('[data-saint-honorific]'))return;
  const href=anchor.getAttribute('href'),destination=/^#?\/lesson\//.test(href)?href:href.startsWith('#reading-')?route:null;if(!destination)return;
  const ctx=contextFor(anchor,destination),walker=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('[data-saint-honorific],.glossary-reference'))nodes.push(walker.currentNode);
  for(const node of nodes){const text=node.nodeValue,fragment=document.createDocumentFragment();let at=0;for(const match of text.matchAll(ctx.pattern)){const resolved=resolve(match[0],text.slice(0,match.index),text.slice(match.index+match[0].length),ctx);if(!resolved||resolved.explicitTitle||/^(?:Saints?|Sts?\.)\s/u.test(match[0]))continue;
    if(!identities[resolved.id].prefix&&resolved.id!=='gabriel-archangel')continue;fragment.append(document.createTextNode(text.slice(at,match.index)));honorific(fragment,resolved.id,match[0]);fragment.append(document.createTextNode(match[0]));at=match.index+match[0].length;}
   if(at){fragment.append(document.createTextNode(text.slice(at)));node.replaceWith(fragment);}
  }
 }
 function enhance(root=document.getElementById('main'),{route=root?.getAttribute('data-route')||window.OrthodoxSite?.route()||location.hash}={}){
  if(!root)return;
  if(/^#?\/(?:notebook|journal|review-cards|editorial|account|settings)(?:[/?]|$)/u.test(route))return;
  for(const anchor of [...(root.matches?.('a[href]')?[root]:[]),...(root.querySelectorAll?.('a[href]')||[])]){const match=anchor.getAttribute('href').match(/^(?:#)?\/saint\/([a-z0-9-]+)\/?(?:[?#].*)?$/);if(match&&!anchor.closest(excluded.replace('.saint-reference,','')))qualifyLink(anchor,match[1]);else qualifyNavigation(anchor,route);}
  const own=route.match(/^#?\/saint\/([^/?]+)/)?.[1],heading=root.matches?.('h1')?root:root.querySelector?.('h1');
  if(own&&identities[own]&&heading&&!heading.querySelector('[data-saint-honorific]')&&!/^(?:Saints?|Sts?\.)\s/u.test(heading.textContent.trim())&&identities[own].prefix){const span=document.createElement('span');span.dataset.saintHonorific='true';span.textContent=identities[own].prefix;heading.prepend(span);}
  const list=[...(root.matches?.(labels)?[root]:[]),...(root.querySelectorAll?.(labels)||[])];
  for(const element of list){
   if(element.closest(excluded)||element.closest('a')||own&&element===heading)continue;
   const ctx=contextFor(element,route),walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){const node=walker.currentNode;if(node.nodeValue?.trim()&&!node.parentElement.closest(excluded+',a,[data-saint-honorific]')&&node.parentElement.closest(labels)===element)nodes.push(node);}
   for(const node of nodes){const text=node.nodeValue,matches=[...text.matchAll(ctx.pattern)];if(!matches.length)continue;const fragment=document.createDocumentFragment();let at=0;
    for(const match of matches){const resolved=resolve(match[0],text.slice(0,match.index),text.slice(match.index+match[0].length),ctx);if(!resolved)continue;
     fragment.append(document.createTextNode(text.slice(at,match.index)));const anchor=document.createElement('a');anchor.className='saint-reference';anchor.dataset.saintId=resolved.id;anchor.setAttribute('href','/saint/'+resolved.id+'/');anchor.setAttribute('title',identities[resolved.id].display);
     if(!ctx.protectedText&&!resolved.explicitTitle&&!/^(?:Saints?|Sts?\.)\s/u.test(match[0]))honorific(anchor,resolved.id,match[0]);anchor.append(document.createTextNode(match[0]));fragment.append(anchor);at=match.index+match[0].length;
    }
    if(at){fragment.append(document.createTextNode(text.slice(at)));node.replaceWith(fragment);}
   }
  }
 }
 function schedule(node){const element=node.nodeType===3?node.parentElement:node;if(!element?.isConnected||element.closest?.(excluded))return;const containing=element.closest?.(labels);queue.add(containing||element);if(!timer)timer=setTimeout(batch,24);}
 function batch(){timer=null;const start=performance.now();for(const item of queue){queue.delete(item);if(item.isConnected)enhance(item,{route:document.getElementById('main')?.dataset.route||window.OrthodoxSite?.route()||location.hash});if(performance.now()-start>5)break;}if(queue.size)timer=setTimeout(batch,24);}
 function start(){const main=document.getElementById('main');if(!main)return;observer=new MutationObserver(mutations=>{for(const mutation of mutations)for(const node of mutation.addedNodes)schedule(node);});observer.observe(main,{childList:true,subtree:true});schedule(main);}
 // Build-time DOM has no browser navigation layer; the generator invokes enhance explicitly.
 if(typeof window.OrthodoxSite!=='undefined')start();
 return {enhance,canonicalText,displayName,start};
})();
