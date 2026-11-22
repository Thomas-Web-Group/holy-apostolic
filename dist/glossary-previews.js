'use strict';
window.GlossaryPreviews=(()=>{
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('en');
  const safe=url=>{try{const value=new URL(url);return value.protocol==='https:'?esc(value.href):'#';}catch{return '#';}};
  const skipped='button,input,textarea,select,option,code,pre,script,style,[contenteditable]:not([contenteditable="false"]),[data-glossary-ref],.scripture-reference,.scripture-assist,#glossary-preview,[data-glossary-skip]';
  const wordForms={'g-icon':['icons','ikons','holy images'],'g-bishop':['bishops'],'g-presbyter':['presbyters','priests'],'g-deacon':['deacons'],'g-martyr':['martyrs'],'g-catechumen':['catechumens'],'g-abbot':['abbots'],'g-abbess':['abbesses'],'g-monk':['monks'],'g-nun':['nuns'],'g-patriarch':['patriarchs'],'g-metropolitan':['metropolitans'],'g-archbishop':['archbishops'],'g-monastery':['monasteries'],'g-homily':['homilies'],'g-parish':['parishes']};
  let terms=new Map(),sources=new Map(),aliases=new Map(),pattern,observer,root,panel,trigger,returnFocus,pinned=false,hoverTimer,closeTimer,frame,ignoreFocusUntil=0,started=false;
  function paragraphs(value){return String(value).split(/\n\s*\n/).map(text=>'<p>'+esc(text).replace(/\n/g,'<br>')+'</p>').join('');}
  function candidate(target){return target.closest?.('[data-glossary-ref]')||target.closest?.('a')?.querySelector('[data-glossary-ref]');}
  function enhance(container=root){
    if(!container||!pattern)return;
    window.ScripturePreviews?.enhance(container);
    const list=container.nodeType===Node.TEXT_NODE?[container.parentElement?.closest('p')].filter(Boolean):[...(container.matches?.('p')?[container]:[]),...(container.querySelectorAll?.('p')||[])];
    for(const paragraph of new Set(list)){
      if(paragraph.closest(skipped))continue;
      const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.nodeValue.trim()&&!node.parentElement.closest(skipped)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}),nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      for(const node of nodes){
        const text=node.nodeValue;pattern.lastIndex=0;const matches=[...text.matchAll(pattern)];if(!matches.length)continue;
        const fragment=document.createDocumentFragment();let at=0;
        for(const match of matches){
          const ids=aliases.get(normalize(match[0]));if(!ids?.length)continue;
          fragment.append(document.createTextNode(text.slice(at,match.index)));
          const span=document.createElement('span');span.className='glossary-reference';span.dataset.glossaryRef=ids.join(',');span.textContent=match[0];span.setAttribute('aria-haspopup','dialog');
          if(node.parentElement.closest('a'))span.dataset.glossaryLinked='true';
          else{span.tabIndex=0;span.setAttribute('role','button');span.setAttribute('aria-label','Glossary: '+match[0]);}
          fragment.append(span);at=match.index+match[0].length;
        }
        fragment.append(document.createTextNode(text.slice(at)));node.replaceWith(fragment);
      }
    }
  }
  function position(){
    if(!panel||!trigger?.isConnected)return;
    const box=trigger.getBoundingClientRect(),margin=12,width=Math.min(460,innerWidth-margin*2);
    panel.style.width=width+'px';panel.style.maxHeight=Math.max(140,innerHeight-margin*2)+'px';
    const height=Math.min(panel.offsetHeight,innerHeight-margin*2),below=box.bottom+8;
    const top=below+height<=innerHeight-margin?below:box.top-height-8>=margin?box.top-height-8:margin;
    panel.style.left=Math.max(margin,Math.min(box.left,innerWidth-width-margin))+'px';panel.style.top=Math.max(margin,top)+'px';
  }
  function close(restore=false){
    clearTimeout(hoverTimer);clearTimeout(closeTimer);
    const old=trigger,fallback=returnFocus;returnFocus=null;if(old){old.removeAttribute('aria-expanded');old.removeAttribute('aria-controls');}
    panel?.remove();panel=null;trigger=null;pinned=false;
    if(restore){const target=old?.isConnected?(old.dataset.glossaryLinked==='true'?old.closest('a'):old):fallback?.isConnected?fallback:null;if(target){ignoreFocusUntil=performance.now()+100;target.focus({preventScroll:true});}}
  }
  function delayClose(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>close(),220);}
  function open(element,pin=false){
    clearTimeout(hoverTimer);clearTimeout(closeTimer);
    if(trigger===element&&panel){if(pin)pinned=true;return;}
    close();const entries=element.dataset.glossaryRef.split(',').map(id=>terms.get(id)).filter(Boolean);if(!entries.length)return;
    trigger=element;pinned=pin;
    if(element.closest('#scripture-preview')){returnFocus=document.querySelector('[aria-controls="scripture-preview"]');window.ScripturePreviews?.retain();}
    panel=document.createElement('section');panel.id='glossary-preview';panel.className='glossary-preview';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Glossary: '+element.textContent);panel.setAttribute('popover','manual');panel.dataset.glossarySkip='true';
    panel.innerHTML='<header><h2>'+esc(element.textContent)+'</h2><button type="button" class="text-button" data-glossary-close aria-label="Close glossary preview">Close</button></header>'+(entries.length>1?'<p class="glossary-multiple">'+entries.length+' glossary entries</p>':'')+'<div class="glossary-preview-content" tabindex="0" aria-label="Glossary definition">'+entries.map(term=>{
      const definition=term.definition,source=sources.get(definition.sourceId),definitionRefs=definition.sourceRefs?.length?definition.sourceRefs:[{sourceId:definition.sourceId,locator:definition.locator}];
      return '<article data-scripture-source="'+esc(definition.sourceId)+'">'+(entries.length>1?'<h3>'+esc(term.term)+'</h3>':'')+(definition.kind==='quotation'?'<blockquote>'+paragraphs(definition.text)+'</blockquote>':''+paragraphs(definition.text))+definitionRefs.map(ref=>{const publication=sources.get(ref.sourceId);return publication?'<p class="glossary-preview-source">'+esc([publication.author,publication.work||publication.title,publication.edition,publication.translator].filter(Boolean).join(' · '))+(ref.locator?' · '+esc(ref.locator):'')+'</p><p class="glossary-preview-source"><a href="'+safe(publication.url)+'" target="_blank" rel="noopener noreferrer">'+esc(publication.title)+'</a> · '+esc(publication.rights||'')+'</p>':'';}).join('')+'<a class="button secondary glossary-learn-more" href="#/term/'+esc(term.id)+'">Learn More'+(entries.length>1?': '+esc(term.term):'')+'</a></article>';
    }).join('')+'</div>';
    panel.dataset.previewOrder=String(window.OrthodoxPreviewSerial=(window.OrthodoxPreviewSerial||0)+1);
    const parent=element.closest('dialog[open]')||document.body;parent.append(panel);
    if(typeof panel.showPopover==='function')panel.showPopover();else panel.classList.add('is-open');
    element.setAttribute('aria-expanded','true');element.setAttribute('aria-controls','glossary-preview');
    panel.querySelector('[data-glossary-close]').onclick=()=>close(true);
    panel.addEventListener('pointerenter',()=>clearTimeout(closeTimer));panel.addEventListener('pointerleave',()=>{if(!pinned)delayClose();});
    window.ScripturePreviews?.enhance(panel);position();
  }
  function bind(){
    if(started)return;started=true;
    document.addEventListener('pointerover',event=>{if(event.pointerType==='touch'||pinned)return;const element=candidate(event.target);if(!element||element===trigger)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>open(element),160);});
    document.addEventListener('pointerout',event=>{const element=candidate(event.target);if(!element||element.contains(event.relatedTarget)||panel?.contains(event.relatedTarget))return;clearTimeout(hoverTimer);if(!pinned)delayClose();});
    document.addEventListener('focusin',event=>{if(panel?.contains(event.target)){retain();return;}if(performance.now()<ignoreFocusUntil)return;const element=candidate(event.target);if(element)open(element);});
    document.addEventListener('focusout',()=>setTimeout(()=>{if(!pinned&&panel&&!panel.contains(document.activeElement)&&document.activeElement!==trigger&&!trigger?.closest('a')?.contains(document.activeElement))close();},0));
    document.addEventListener('click',event=>{
      if(panel&&event.composedPath().includes(panel)){pinned=true;return;}
      const element=candidate(event.target);
      if(element){if(element.dataset.glossaryLinked==='true')return;if(!window.getSelection()?.isCollapsed)return;event.preventDefault();event.stopPropagation();if(element===trigger&&pinned)close();else open(element,true);}
      else if(panel&&!event.target.closest?.('#scripture-preview'))close();
    });
    document.addEventListener('keydown',event=>{
      if(event.defaultPrevented)return;
      const scripture=document.querySelector('#scripture-preview');
      if(event.key==='Escape'&&panel&&(!scripture||Number(scripture.dataset.previewOrder||0)<Number(panel.dataset.previewOrder||0))){event.preventDefault();event.stopPropagation();close(true);}
      else if((event.key==='Enter'||event.key===' ')&&event.target.matches('.glossary-reference[role="button"]')){event.preventDefault();event.stopPropagation();open(event.target,true);panel?.querySelector('[data-glossary-close]')?.focus();}
    },true);
    window.addEventListener('hashchange',()=>close());window.addEventListener('resize',position);window.addEventListener('scroll',event=>{if(panel&&!panel.contains(event.target))position();},true);
  }
  const scanQueue=new Set();let scanTimer;
  function queueScan(container){if(!container)return;const element=container.nodeType===Node.TEXT_NODE?container.parentElement:container;if(!element?.querySelectorAll)return;if(element.closest('.glossary-reference,.scripture-reference'))return;const parent=element.closest('p');if(parent)scanQueue.add(parent);for(const paragraph of element.querySelectorAll('p'))scanQueue.add(paragraph);if(element.matches('p'))scanQueue.add(element);if(!scanTimer)scanTimer=setTimeout(scanBatch,24);}
  function scanBatch(){scanTimer=null;const start=performance.now();for(const paragraph of scanQueue){scanQueue.delete(paragraph);if(paragraph.isConnected)enhance(paragraph);if(performance.now()-start>5)break;}if(scanQueue.size)scanTimer=setTimeout(scanBatch,24);}
  function configure(glossary,sourceMap){
    terms=new Map(glossary.terms.map(term=>[term.id,term]));sources=sourceMap instanceof Map?sourceMap:new Map(sourceMap.map(source=>[source.id,source]));aliases=new Map();
    const pluralForms={icon:'icons',ikon:'ikons',bishop:'bishops',priest:'priests',presbyter:'presbyters',deacon:'deacons',subdeacon:'subdeacons',reader:'readers',chanter:'chanters',martyr:'martyrs',catechumen:'catechumens',metropolitan:'metropolitans',archbishop:'archbishops',patriarch:'patriarchs',synod:'synods',canon:'canons',tabernacle:'tabernacles',monastery:'monasteries'};
    for(const term of terms.values())for(const name of [term.term,...(term.aliases||[]),...(wordForms[term.id]||[]),...[term.term,...(term.aliases||[])].map(name=>pluralForms[normalize(name)]).filter(Boolean)]){
      if(typeof name!=='string'||name.length<2)continue;const key=normalize(name);if(!aliases.has(key))aliases.set(key,[]);if(!aliases.get(key).includes(term.id))aliases.get(key).push(term.id);
    }
    const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+[...aliases.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![\\p{L}\\p{N}_])','giu');
    root=document.body;bind();observer?.disconnect();scanQueue.clear();queueScan(root);
    observer=new MutationObserver(mutations=>{
      if(trigger&&(!trigger.isConnected||!trigger.getClientRects().length))close();
      for(const mutation of mutations){if(mutation.type==='characterData')queueScan(mutation.target);else for(const node of mutation.addedNodes)if(node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE)queueScan(node);}

    });
    observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','open']});
  }
  function retain(){if(panel){pinned=true;clearTimeout(closeTimer);}}
  return {configure,enhance,close,retain};
})();
