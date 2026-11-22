'use strict';
window.OrthodoxIcons=(()=>{
  let promise,cleanup=()=>{};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const paragraphs=value=>String(value||'').split(/\n\s*\n/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
  const safe=url=>{try{const u=new URL(url);return u.protocol==='https:'?esc(u.href):'#';}catch{return '#';}};
  const external=(url,title)=>'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+esc(title)+'</a>';
  async function load(id){
    if(window.OrthodoxSite){const data=await window.OrthodoxResources.json('page-data/icons/'+(id||'index')+'.json');return {...data,images:new Map(data.images.map(image=>[image.iconId,image]))};}
    return promise||(promise=Promise.all(['icon-library.json','icon-images.json'].map(async file=>{const response=await fetch('content/'+file);if(!response.ok)throw new Error('The icon library could not be loaded.');return response.json();})).then(([data,art])=>({...data,images:new Map(art.images.map(image=>[image.iconId,image]))})).catch(error=>{promise=null;throw error;}));
  }
  function unmount(){cleanup();cleanup=()=>{};}
  async function mount(ctx){
    unmount();const {root,id,params=new URLSearchParams()}=ctx,controller=new AbortController(),signal=controller.signal;
    cleanup=()=>controller.abort();root.innerHTML='<p role="status">Loading icons…</p>';
    let data;try{data=await load(id);}catch(error){if(signal.aborted)return;root.innerHTML='<h1>Icons</h1><p>The icon library could not be loaded.</p><button type="button" class="secondary" data-icons-retry>Try again</button>';root.querySelector('button').onclick=()=>mount(ctx);return;}
    if(signal.aborted||!root.isConnected)return;
    const sources=new Map(data.sources.map(source=>[source.id,source])),profiles=new Map(data.profiles.map(profile=>[profile.id,profile]));
    const references=block=>block.sourceRefs?.length?block.sourceRefs:block.sourceId?[{sourceId:block.sourceId,locator:block.locator}]:[];
    const sourceMeta=source=>[source.author,source.work||source.title,source.edition,source.translator].filter(Boolean).map(esc).join(' · ');
    root.addEventListener('click',event=>{const anchor=event.target.closest('[data-icon-scroll]');if(!anchor)return;event.preventDefault();const target=root.querySelector('#'+CSS.escape(anchor.dataset.iconScroll));if(target){target.tabIndex=-1;target.scrollIntoView();target.focus({preventScroll:true});}},{signal});
    if(id){
      const profile=profiles.get(id);if(!profile){root.innerHTML='<h1>Icon not found</h1><a href="#/icons">Icons</a>';return;}
      const image=data.images.get(id),blocks=[profile.overview,...profile.sections.flatMap(section=>section.blocks)].filter(Boolean);
      const used=[...new Set(blocks.flatMap(block=>references(block).map(ref=>ref.sourceId)))],numbers=new Map(used.map((sid,i)=>[sid,i+1]));
      function renderBlock(block,scope){
        const refs=references(block),source=sources.get(refs[0]?.sourceId);
        const citations=refs.map(ref=>'<a href="#icon-source-'+esc(ref.sourceId)+'" data-icon-scroll="icon-source-'+esc(ref.sourceId)+'" aria-label="Source '+numbers.get(ref.sourceId)+'">['+numbers.get(ref.sourceId)+']</a> <span>'+esc(ref.locator||'Published account')+'</span>').join(' · ');
        return '<div class="icon-source-block" data-study-scope="icon-'+esc(id)+'-'+esc(scope)+'" data-icon-kind="'+esc(block.kind)+'"'+(source?' data-scripture-source="'+esc(source.id)+'"':'')+(block.edition==='kjv'?' data-scripture-edition="kjv"':'')+'>'+(block.kind==='quotation'?'<blockquote class="quoted-reading">'+paragraphs(block.text)+'</blockquote>':'<div class="icon-summary">'+paragraphs(block.text).replace(/<p>/g,'<p data-annotatable>')+'</div>')+(block.context?'<p class="reading-context">'+esc(block.context)+'</p>':'')+'<p class="icon-citations">'+citations+'</p></div>';
      }
      root.innerHTML='<article class="icon-reader"><p><a href="#/icons">Icons</a></p><header class="saint-profile-heading icon-profile-heading">'+window.OrthodoxVisuals.picture(image,{title:profile.title,deferCredit:true})+'<div><p class="icon-subject">'+esc(profile.subject)+'</p><h1>'+esc(profile.title)+'</h1>'+(profile.aliases?.length?'<p class="icon-aliases">'+profile.aliases.map(esc).join(' · ')+'</p>':'')+'<nav class="icon-section-nav" aria-label="Icon sections">'+profile.sections.map(section=>'<a href="#icon-'+esc(section.id)+'" data-icon-scroll="icon-'+esc(section.id)+'">'+esc(section.title)+'</a>').join('')+'<a href="#icon-sources" data-icon-scroll="icon-sources">Sources</a></nav>'+(profile.scripture?.length?'<section class="icon-scripture" data-scripture-edition="kjv" data-scripture-source="sp-kjv"><h2>Scripture</h2>'+profile.scripture.map(item=>'<p>'+esc(item.reference)+'</p>').join('')+'<p class="reading-attribution">King James Version · Scripture previews</p></section>':'')+'</div></header>'+renderBlock(profile.overview,'overview')+profile.sections.map(section=>'<section class="icon-reading-section" id="icon-'+esc(section.id)+'" tabindex="-1"><h2>'+esc(section.title)+'</h2>'+section.blocks.map((block,index)=>renderBlock(block,section.id+'-'+index)).join('')+'</section>').join('')+
        (profile.relatedSaintIds?.length?'<section><h2>Saints</h2><ul>'+profile.relatedSaintIds.map(sid=>'<li><a href="#/saint/'+esc(sid)+'">'+esc(data.saintNames?.[sid]||({theotokos:'Mary, the Theotokos','john-baptist':'John the Baptist',nicholas:'Nicholas of Myra',george:'George the Trophy-bearer',seraphim:'Seraphim of Sarov'})[sid]||sid)+'</a></li>').join('')+'</ul></section>':'')+
        '<section><h2>Curriculum</h2><p><a href="#/learn?q=icons">Readings on icons and veneration</a></p></section>'+
        (profile.relatedIconIds?.some(related=>profiles.has(related))?'<section><h2>Related icons</h2><ul>'+profile.relatedIconIds.filter(related=>profiles.has(related)).map(related=>'<li><a href="#/icon/'+esc(related)+'">'+esc(profiles.get(related).title)+'</a></li>').join('')+'</ul></section>':'')+
        '<section id="icon-sources"><h2>Sources</h2>'+window.OrthodoxVisuals.artworkSource(image)+'<ol>'+used.map(sid=>{const source=sources.get(sid);return '<li id="icon-source-'+esc(sid)+'" tabindex="-1">'+(source?external(source.url,source.title)+'<p>'+sourceMeta(source)+'</p><p>'+esc(source.type||'Published source')+' · '+esc(source.tradition||'')+'</p><p>'+(source.rightsUrl?external(source.rightsUrl,source.rights||'Rights'):esc(source.rights||''))+'</p>'+(source.attribution?'<p>'+esc(source.attribution)+'</p>':'')+(source.rightsNote?'<p>'+esc(source.rightsNote)+'</p>':''):'Source unavailable')+'</li>';}).join('')+'</ol></section><details class="source-context"><summary>Source context</summary><p>'+esc(data.selection)+'</p>'+'</details></article>';
      window.OrthodoxVisuals.bindArtwork(root,image,profile.title,signal);window.ScripturePreviews?.enhance(root);return;
    }
    const query={q:params.get('q')||'',subject:params.get('subject')||''},subjects=[...new Set(data.profiles.map(profile=>profile.subject))];
    root.innerHTML='<div class="page-heading"><h1>Icons</h1></div><form class="icon-filters" role="search"><label>Search icons<input type="search" id="icons-query" value="'+esc(query.q)+'" placeholder="Name, subject, or iconographic type" autocomplete="off"></label><label>Subject<select id="icons-subject"><option value="">All subjects</option>'+subjects.map(subject=>'<option value="'+esc(subject)+'"'+(query.subject===subject?' selected':'')+'>'+esc(subject)+'</option>').join('')+'</select></label><button type="button" class="text-button" data-icons-reset>Reset filters</button></form><p class="result-count" id="icons-count" aria-live="polite"></p><div class="icons-grid" id="icons-results"></div><details class="source-context"><summary>Selection and sources</summary><p>'+esc(data.selection)+'</p><p>Image sources, file licenses, and published explanations are identified on each entry.</p></details>';
    let deepSearch=null,searchPending=false;async function searchExplanations(){if(!window.OrthodoxSite||deepSearch||searchPending||!query.q.trim())return;searchPending=true;try{const rows=await window.OrthodoxResources.json('page-data/icons/search.json');deepSearch=new Map(rows.map(r=>[r.id,r.text]));if(!signal.aborted)render();}catch{}finally{searchPending=false;}}
    function render(){
      searchExplanations();const words=norm(query.q).trim().split(/\s+/).filter(Boolean),found=data.profiles.filter(profile=>(!query.subject||profile.subject===query.subject)&&words.every(word=>norm([deepSearch?.get(profile.id)||'',profile.title,...profile.aliases,profile.subject,profile.overview.text,...profile.sections.flatMap(section=>section.blocks.map(block=>block.text))].join(' ')).includes(word)));
      root.querySelector('#icons-count').textContent=found.length+' of '+data.profiles.length+' icons';
      root.querySelector('#icons-results').innerHTML=found.length?found.map(profile=>{
        const image=data.images.get(profile.id);return '<article class="icon-card" data-icon-card="'+esc(profile.id)+'">'+window.OrthodoxVisuals.picture(image,{card:true,title:profile.title,href:'#/icon/'+profile.id})+'<div class="icon-card-body"><p class="icon-subject">'+esc(profile.subject)+'</p><h2><a href="#/icon/'+esc(profile.id)+'">'+esc(profile.title)+'</a></h2>'+(profile.aliases?.length?'<p class="icon-card-aliases">'+profile.aliases.map(esc).join(' · ')+'</p>':'')+'</div><p class="icon-card-credit">'+window.OrthodoxVisuals.credit(image)+'</p></article>';
      }).join(''):'<div class="empty"><h2>No matching icons</h2><p>Change the search or reset the filters.</p></div>';
      const params=new URLSearchParams();for(const [key,value]of Object.entries(query))if(value)params.set(key,value);history.replaceState(null,'','#/icons'+(params.size?'?'+params.toString():''));
    }
    window.OrthodoxVisuals.bindArtwork(root,null,'',signal);
    root.addEventListener('submit',event=>event.preventDefault(),{signal});
    root.addEventListener('input',event=>{if(event.target.id==='icons-query'){query.q=event.target.value;render();}},{signal});
    root.addEventListener('change',event=>{if(event.target.id==='icons-subject'){query.subject=event.target.value;render();}},{signal});
    root.addEventListener('click',event=>{if(event.target.closest('[data-icons-reset]')){query.q='';query.subject='';root.querySelector('#icons-query').value='';root.querySelector('#icons-subject').value='';render();return;}const card=event.target.closest('[data-icon-card]');if(card&&!event.target.closest('a,button')&&window.getSelection()?.isCollapsed!==false)location.hash='/icon/'+card.dataset.iconCard;},{signal});
    render();
  }
  return {load,mount,unmount};
})();
